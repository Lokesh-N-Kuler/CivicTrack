import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from app.core.database import get_db
from app.api.deps import get_current_user, get_current_admin, get_client_ip
from app.models.user import User
from app.models.department import Department
from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.models.image import ComplaintImage
from app.models.authority import AuthorityDirectory
from app.models.external_submission import ExternalSubmissionRecord
from app.models.notification import Notification
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdateAdmin,
    ComplaintCitizenFollowup,
    ComplaintListResponse,
    ComplaintListItem,
    ComplaintDetailResponse,
    DuplicateSuggestion
)
from app.schemas.image import ImageResponse
from app.schemas.history import HistoryResponse
from app.schemas.external_submission import (
    ExternalSubmissionResponse,
    ExternalSubmissionRecordCreate,
    ExternalSubmissionSimulateRequest
)
from app.services.routing_engine import recommend_department
from app.services.duplicate_detector import find_possible_duplicates
from app.services.escalation_service import evaluate_escalation
from app.services.government_integrations import (
    SimulatedGovernmentAdapter,
    generate_official_complaint_summary
)
from app.services.storage_service import storage_service
from app.services.audit_service import log_audit_event

router = APIRouter()


def generate_tracking_id(db: Session) -> str:
    """
    Generates a unique, concurrency-safe CivicTrack ID in format CT-YYYY-NNNNNN.
    e.g. CT-2026-000001
    """
    current_year = datetime.now(timezone.utc).year
    prefix = f"CT-{current_year}-"
    
    # Query maximum tracking id for this year
    last_complaint = (
        db.query(Complaint)
        .filter(Complaint.tracking_id.like(f"{prefix}%"))
        .order_by(desc(Complaint.tracking_id))
        .first()
    )
    
    next_num = 1
    if last_complaint and last_complaint.tracking_id:
        try:
            num_part = int(last_complaint.tracking_id.split("-")[-1])
            next_num = num_part + 1
        except (ValueError, IndexError):
            next_num = 1

    return f"{prefix}{next_num:06d}"


@router.post("", response_model=ComplaintDetailResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint_in: ComplaintCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        tracking_id = generate_tracking_id(db)
        
        # Determine recommended department
        recommendation = recommend_department(
            db=db,
            category=complaint_in.category,
            text_context=f"{complaint_in.title} {complaint_in.description}"
        )

        new_complaint = Complaint(
            tracking_id=tracking_id,
            citizen_id=current_user.id,
            title=complaint_in.title.strip(),
            description=complaint_in.description.strip(),
            category=complaint_in.category.strip(),
            priority=complaint_in.priority,
            status="Submitted to CivicTrack",
            department_id=recommendation["department_id"],  # Initial assignment matches recommendation
            recommended_department_id=recommendation["department_id"],
            recommendation_reason=recommendation["explanation"],
            address=complaint_in.address.strip(),
            locality=complaint_in.locality.strip() if complaint_in.locality else None,
            latitude=complaint_in.latitude,
            longitude=complaint_in.longitude,
            geocoding_id=complaint_in.geocoding_id,
            selection_method=complaint_in.selection_method or "search",
            is_demo=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(new_complaint)
        db.flush()

        # Initial status history record
        initial_history = ComplaintHistory(
            complaint_id=new_complaint.id,
            previous_status=None,
            new_status="Submitted to CivicTrack",
            acting_user_id=current_user.id,
            action_type="initial_submission",
            notes=(
                f"Grievance registered. Automatically routed to {recommendation['department_name']}. "
                f"Reason: {recommendation['explanation']}"
            ),
            created_at=datetime.now(timezone.utc)
        )
        db.add(initial_history)

        # In-app citizen notification
        citizen_notif = Notification(
            user_id=current_user.id,
            complaint_id=new_complaint.id,
            title="Grievance Registered",
            message=f"Your complaint #{tracking_id} '{complaint_in.title}' has been successfully logged."
        )
        db.add(citizen_notif)

        # Audit log
        client_ip = get_client_ip(request)
        log_audit_event(
            db=db,
            action="CREATE_COMPLAINT",
            resource_type="complaint",
            resource_id=tracking_id,
            user_id=current_user.id,
            details={"category": complaint_in.category, "priority": complaint_in.priority},
            ip_address=client_ip
        )

        db.commit()
        db.refresh(new_complaint)
        return get_complaint_detail_data(db, new_complaint, current_user)

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit complaint: {str(e)}"
        )


@router.post("/{complaint_id}/upload-image", response_model=ImageResponse)
async def upload_complaint_image(
    complaint_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # Ownership check
    if complaint.citizen_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to attach images to this complaint.")

    content = await file.read()
    filename, safe_path, size = storage_service.save_image(file, content)

    img_record = ComplaintImage(
        complaint_id=complaint.id,
        filename=filename,
        original_filename=file.filename or "attachment",
        mime_type=file.content_type or "image/jpeg",
        file_size=size,
        storage_path=safe_path,
        created_at=datetime.now(timezone.utc)
    )
    db.add(img_record)

    # Log timeline note
    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        previous_status=complaint.status,
        new_status=complaint.status,
        acting_user_id=current_user.id,
        action_type="image_uploaded",
        notes=f"Attached photo verification: {file.filename}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(history_entry)

    db.commit()
    db.refresh(img_record)

    return ImageResponse(
        id=img_record.id,
        complaint_id=img_record.complaint_id,
        filename=img_record.filename,
        original_filename=img_record.original_filename,
        mime_type=img_record.mime_type,
        file_size=img_record.file_size,
        url=f"/api/v1/complaints/images/{img_record.filename}",
        created_at=img_record.created_at
    )


@router.get("/images/{filename}")
def get_complaint_image_file(filename: str):
    from fastapi.responses import FileResponse
    safe_filename = os.path.basename(filename)
    file_path = os.path.join(storage_service.upload_dir, safe_filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image file not found.")
    return FileResponse(file_path)


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    department_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    is_demo: Optional[bool] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Complaint)

    # CITIZEN OWNERSHIP RULE:
    # A citizen must NEVER see another citizen's private complaint!
    if current_user.role != "admin":
        query = query.filter(Complaint.citizen_id == current_user.id)

    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if priority:
        query = query.filter(Complaint.priority == priority)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if is_demo is not None:
        query = query.filter(Complaint.is_demo == is_demo)
    if search:
        search_filter = or_(
            Complaint.tracking_id.ilike(f"%{search}%"),
            Complaint.title.ilike(f"%{search}%"),
            Complaint.description.ilike(f"%{search}%"),
            Complaint.address.ilike(f"%{search}%"),
        )
        query = query.filter(search_filter)

    total = query.count()
    offset = (page - 1) * page_size
    complaints = query.order_by(desc(Complaint.created_at)).offset(offset).limit(page_size).all()

    items: List[ComplaintListItem] = []
    for c in complaints:
        esc = evaluate_escalation(c)
        items.append(ComplaintListItem(
            id=c.id,
            tracking_id=c.tracking_id,
            title=c.title,
            category=c.category,
            priority=c.priority,
            status=c.status,
            address=c.address,
            locality=c.locality,
            latitude=c.latitude,
            longitude=c.longitude,
            department_id=c.department_id,
            department_name=c.department.name if c.department else None,
            is_demo=c.is_demo,
            is_escalated=esc["is_escalated"],
            escalation_reason=esc["escalation_reason"],
            hours_in_status=esc["hours_in_status"],
            created_at=c.created_at,
            updated_at=c.updated_at
        ))

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return ComplaintListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{complaint_id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    complaint_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    # CITIZEN RESTRICTION: Cannot read or modify another citizen's private complaint!
    if current_user.role != "admin" and complaint.citizen_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You cannot view grievances submitted by other citizens."
        )

    return get_complaint_detail_data(db, complaint, current_user)


def get_complaint_detail_data(db: Session, complaint: Complaint, current_user: User) -> ComplaintDetailResponse:
    esc = evaluate_escalation(complaint)
    
    # Check for possible duplicates (for admin review or citizen awareness)
    duplicates = find_possible_duplicates(db, complaint, limit=4)

    # Format images
    images_res = [
        ImageResponse(
            id=img.id,
            complaint_id=img.complaint_id,
            filename=img.filename,
            original_filename=img.original_filename,
            mime_type=img.mime_type,
            file_size=img.file_size,
            url=f"/api/v1/complaints/images/{img.filename}",
            created_at=img.created_at
        )
        for img in complaint.images
    ]

    # Format history
    history_res = [
        HistoryResponse(
            id=h.id,
            complaint_id=h.complaint_id,
            previous_status=h.previous_status,
            new_status=h.new_status,
            acting_user_id=h.acting_user_id,
            acting_user_name=h.acting_user.full_name if h.acting_user else "System",
            action_type=h.action_type,
            notes=h.notes,
            created_at=h.created_at
        )
        for h in complaint.history
    ]

    # Format external submissions
    sub_res = [
        ExternalSubmissionResponse(
            id=s.id,
            complaint_id=s.complaint_id,
            authority_id=s.authority_id,
            authority_name=s.authority.name if s.authority else "External Portal",
            submission_type=s.submission_type,
            official_reference_number=s.official_reference_number,
            is_verified=s.is_verified,
            status=s.status,
            disclaimer=s.disclaimer,
            response_payload=s.response_payload,
            created_at=s.created_at
        )
        for s in complaint.external_submissions
    ]

    return ComplaintDetailResponse(
        id=complaint.id,
        tracking_id=complaint.tracking_id,
        citizen_id=complaint.citizen_id,
        citizen_name=complaint.citizen.full_name if complaint.citizen else "Citizen",
        citizen_email=complaint.citizen.email if complaint.citizen else "",
        title=complaint.title,
        description=complaint.description,
        category=complaint.category,
        priority=complaint.priority,
        status=complaint.status,
        department_id=complaint.department_id,
        department=complaint.department,
        recommended_department_id=complaint.recommended_department_id,
        recommended_department=complaint.recommended_department,
        recommendation_reason=complaint.recommendation_reason,
        address=complaint.address,
        locality=complaint.locality,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
        geocoding_id=complaint.geocoding_id,
        selection_method=complaint.selection_method,
        is_demo=complaint.is_demo,
        admin_notes=complaint.admin_notes if current_user.role == "admin" else None,
        is_escalated=esc["is_escalated"],
        escalation_reason=esc["escalation_reason"],
        hours_in_status=esc["hours_in_status"],
        recommended_escalation_action=esc["recommended_action"],
        created_at=complaint.created_at,
        updated_at=complaint.updated_at,
        resolved_at=complaint.resolved_at,
        history=history_res,
        images=images_res,
        external_submissions=sub_res,
        possible_duplicates=duplicates
    )


@router.post("/{complaint_id}/followup")
def add_citizen_followup(
    complaint_id: int,
    followup: ComplaintCitizenFollowup,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if complaint.citizen_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    history_entry = ComplaintHistory(
        complaint_id=complaint.id,
        previous_status=complaint.status,
        new_status=complaint.status,
        acting_user_id=current_user.id,
        action_type="citizen_followup",
        notes=f"Citizen follow-up: {followup.message.strip()}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(history_entry)

    # If complaint was waiting for citizen follow-up, transition back to In Progress or Under Review
    if complaint.status == "Follow-up Required":
        complaint.status = "In Progress"
        history_transition = ComplaintHistory(
            complaint_id=complaint.id,
            previous_status="Follow-up Required",
            new_status="In Progress",
            acting_user_id=current_user.id,
            action_type="status_change",
            notes="Status transitioned back to In Progress following citizen feedback.",
            created_at=datetime.now(timezone.utc)
        )
        db.add(history_transition)

    complaint.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Follow-up added successfully."}


@router.patch("/{complaint_id}", response_model=ComplaintDetailResponse)
def update_complaint_admin(
    complaint_id: int,
    update_in: ComplaintUpdateAdmin,
    request: Request,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    previous_status = complaint.status
    changes = []

    # Status update
    if update_in.status and update_in.status != complaint.status:
        valid_statuses = [
            "Submitted to CivicTrack", "Under Review", "Authority Recommended",
            "Awaiting Official Submission", "Official Submission Confirmed",
            "Assigned", "In Progress", "Resolved", "Rejected", "Follow-up Required"
        ]
        if update_in.status not in valid_statuses:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status '{update_in.status}'.")

        complaint.status = update_in.status
        changes.append(f"Status changed from '{previous_status}' to '{update_in.status}'")

        if update_in.status == "Resolved":
            complaint.resolved_at = datetime.now(timezone.utc)
        elif previous_status == "Resolved" and update_in.status != "Resolved":
            complaint.resolved_at = None

        # Add history log
        note_text = update_in.status_note or f"Status updated by administrator ({admin.full_name})."
        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            previous_status=previous_status,
            new_status=update_in.status,
            acting_user_id=admin.id,
            action_type="status_change",
            notes=note_text,
            created_at=datetime.now(timezone.utc)
        )
        db.add(history_entry)

        # Notify citizen
        db.add(Notification(
            user_id=complaint.citizen_id,
            complaint_id=complaint.id,
            title=f"Status Update: {update_in.status}",
            message=f"Grievance #{complaint.tracking_id} status changed to '{update_in.status}'. {note_text}"
        ))

    # Department reassignment
    if update_in.department_id and update_in.department_id != complaint.department_id:
        target_dept = db.query(Department).filter(Department.id == update_in.department_id).first()
        if not target_dept:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target department not found.")
        
        old_dept_name = complaint.department.name if complaint.department else "None"
        complaint.department_id = target_dept.id
        changes.append(f"Department reassigned from '{old_dept_name}' to '{target_dept.name}'")

        db.add(ComplaintHistory(
            complaint_id=complaint.id,
            previous_status=complaint.status,
            new_status=complaint.status,
            acting_user_id=admin.id,
            action_type="department_reassigned",
            notes=f"Department corrected/reassigned to {target_dept.name} by administrator. {update_in.status_note or ''}",
            created_at=datetime.now(timezone.utc)
        ))

    # Priority update
    if update_in.priority and update_in.priority != complaint.priority:
        old_priority = complaint.priority
        complaint.priority = update_in.priority
        changes.append(f"Priority changed from '{old_priority}' to '{update_in.priority}'")

        db.add(ComplaintHistory(
            complaint_id=complaint.id,
            previous_status=complaint.status,
            new_status=complaint.status,
            acting_user_id=admin.id,
            action_type="priority_change",
            notes=f"Priority updated from {old_priority.capitalize()} to {update_in.priority.capitalize()}.",
            created_at=datetime.now(timezone.utc)
        ))

    if update_in.admin_notes is not None:
        complaint.admin_notes = update_in.admin_notes

    complaint.updated_at = datetime.now(timezone.utc)

    # Audit log
    log_audit_event(
        db=db,
        action="UPDATE_COMPLAINT_ADMIN",
        resource_type="complaint",
        resource_id=complaint.tracking_id,
        user_id=admin.id,
        details={"changes": changes, "notes": update_in.status_note},
        ip_address=get_client_ip(request)
    )

    db.commit()
    db.refresh(complaint)
    return get_complaint_detail_data(db, complaint, admin)


@router.get("/{complaint_id}/official-summary")
def get_official_summary(
    complaint_id: int,
    authority_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role != "admin" and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    authority = None
    if authority_id:
        authority = db.query(AuthorityDirectory).filter(AuthorityDirectory.id == authority_id).first()

    summary = generate_official_complaint_summary(complaint, authority)
    return summary


@router.post("/{complaint_id}/record-official-submission", response_model=ExternalSubmissionResponse)
def record_citizen_official_submission(
    complaint_id: int,
    submission_in: ExternalSubmissionRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role != "admin" and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    # Record external submission with unverified status
    ext_record = ExternalSubmissionRecord(
        complaint_id=complaint.id,
        authority_id=submission_in.authority_id,
        submission_type="citizen_recorded",
        official_reference_number=submission_in.official_reference_number.strip(),
        is_verified=False,  # Citizen-entered references are explicitly unverified until confirmed
        status="submitted",
        disclaimer="Citizen-reported official reference number (Pending municipal verification)",
        created_at=datetime.now(timezone.utc)
    )
    db.add(ext_record)

    # Update complaint status
    complaint.status = "Official Submission Confirmed"
    complaint.updated_at = datetime.now(timezone.utc)

    db.add(ComplaintHistory(
        complaint_id=complaint.id,
        previous_status="Awaiting Official Submission",
        new_status="Official Submission Confirmed",
        acting_user_id=current_user.id,
        action_type="official_submission_recorded",
        notes=(
            f"Citizen recorded official external reference #{submission_in.official_reference_number.strip()}. "
            f"Note: Reference is unverified pending administrative/department confirmation."
        ),
        created_at=datetime.now(timezone.utc)
    ))

    db.commit()
    db.refresh(ext_record)
    return ExternalSubmissionResponse(
        id=ext_record.id,
        complaint_id=ext_record.complaint_id,
        authority_id=ext_record.authority_id,
        authority_name=ext_record.authority.name if ext_record.authority else "External Portal",
        submission_type=ext_record.submission_type,
        official_reference_number=ext_record.official_reference_number,
        is_verified=ext_record.is_verified,
        status=ext_record.status,
        disclaimer=ext_record.disclaimer,
        response_payload=ext_record.response_payload,
        created_at=ext_record.created_at
    )


@router.post("/{complaint_id}/simulate-official-submission", response_model=ExternalSubmissionResponse)
def simulate_official_submission(
    complaint_id: int,
    sim_in: ExternalSubmissionSimulateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found.")

    if current_user.role != "admin" and complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    authority = None
    if sim_in.authority_id:
        authority = db.query(AuthorityDirectory).filter(AuthorityDirectory.id == sim_in.authority_id).first()

    adapter = SimulatedGovernmentAdapter()
    record = adapter.submit_grievance(db, complaint, authority, acting_user_id=current_user.id)

    return ExternalSubmissionResponse(
        id=record.id,
        complaint_id=record.complaint_id,
        authority_id=record.authority_id,
        authority_name=record.authority.name if record.authority else "Simulated Municipal Gateway",
        submission_type=record.submission_type,
        official_reference_number=record.official_reference_number,
        is_verified=record.is_verified,
        status=record.status,
        disclaimer=record.disclaimer,  # SIMULATED — NOT SENT TO GOVERNMENT
        response_payload=record.response_payload,
        created_at=record.created_at
    )
