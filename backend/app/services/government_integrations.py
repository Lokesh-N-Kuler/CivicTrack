import json
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.authority import AuthorityDirectory
from app.models.external_submission import ExternalSubmissionRecord
from app.models.history import ComplaintHistory


class GovernmentIntegrationAdapter(ABC):
    """
    Abstract base interface for government department grievance dispatch adapters.
    """
    @abstractmethod
    def submit_grievance(
        self,
        db: Session,
        complaint: Complaint,
        authority: Optional[AuthorityDirectory],
        acting_user_id: Optional[int]
    ) -> ExternalSubmissionRecord:
        pass


class SimulatedGovernmentAdapter(GovernmentIntegrationAdapter):
    """
    Simulated Adapter for local demonstration and training environments.
    Prominently displays: SIMULATED — NOT SENT TO GOVERNMENT.
    Does not make any real network requests or transmit citizen data.
    """
    def submit_grievance(
        self,
        db: Session,
        complaint: Complaint,
        authority: Optional[AuthorityDirectory],
        acting_user_id: Optional[int]
    ) -> ExternalSubmissionRecord:
        sim_ref = f"SIM-GOV-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:8].upper()}"
        idempotency_key = f"sim_{complaint.id}_{uuid.uuid4().hex[:12]}"
        
        auth_name = authority.name if authority else "Demonstration Municipal Portal"
        
        payload = {
            "grievance_title": complaint.title,
            "category": complaint.category,
            "address": complaint.address,
            "coordinates": {
                "latitude": complaint.latitude,
                "longitude": complaint.longitude,
            } if complaint.latitude else None,
            "simulated_environment": True,
            "disclaimer": "SIMULATED — NOT SENT TO GOVERNMENT",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        response = {
            "status": "ACCEPTED_SIMULATED",
            "simulation_notice": "THIS IS A TEST SUBMISSION. NO REAL MUNICIPAL RECORD WAS CREATED.",
            "simulated_token": sim_ref,
            "authority_targeted": auth_name,
            "acknowledged_at": datetime.now(timezone.utc).isoformat()
        }

        record = ExternalSubmissionRecord(
            complaint_id=complaint.id,
            authority_id=authority.id if authority else None,
            submission_type="simulated_adapter",
            official_reference_number=sim_ref,
            is_verified=False,
            status="submitted",
            submission_payload=json.dumps(payload),
            response_payload=json.dumps(response),
            idempotency_key=idempotency_key,
            disclaimer="SIMULATED — NOT SENT TO GOVERNMENT",
            created_at=datetime.now(timezone.utc)
        )
        db.add(record)

        # Update complaint status to reflect simulated submission
        complaint.status = "Official Submission Confirmed"
        
        # Add history entry
        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            previous_status="Awaiting Official Submission",
            new_status="Official Submission Confirmed",
            acting_user_id=acting_user_id,
            action_type="official_submission_recorded",
            notes=f"Simulated government submission processed. Reference: {sim_ref}. (SIMULATED — NOT SENT TO GOVERNMENT)",
            created_at=datetime.now(timezone.utc)
        )
        db.add(history_entry)
        db.commit()
        db.refresh(record)
        return record


def generate_official_complaint_summary(complaint: Complaint, authority: Optional[AuthorityDirectory] = None) -> Dict[str, str]:
    """
    Generates a structured, polite, copyable text summary designed for a citizen to paste
    directly into official government complaint portals (e.g., CPGRAMS, Swachhata, BBMP Sahaaya, etc.).
    """
    dept_name = authority.name if authority else (complaint.department.name if complaint.department else "Municipal Grievance Officer")
    coords_text = f" ({complaint.latitude:.5f}, {complaint.longitude:.5f})" if complaint.latitude and complaint.longitude else ""
    
    plain_text = (
        f"GRIEVANCE SUMMARY FOR OFFICIAL SUBMISSION\n"
        f"-----------------------------------------\n"
        f"Target Authority: {dept_name}\n"
        f"CivicTrack Reference ID: {complaint.tracking_id}\n"
        f"Date of Report: {complaint.created_at.strftime('%Y-%m-%d %H:%M UTC')}\n\n"
        f"Subject: {complaint.title}\n"
        f"Category: {complaint.category.replace('_', ' ').title()}\n"
        f"Priority Level: {complaint.priority.capitalize()}\n"
        f"Incident Location: {complaint.address}{coords_text}\n\n"
        f"Detailed Description:\n"
        f"{complaint.description}\n\n"
        f"Citizen Contact Notice:\n"
        f"Submitted via CivicTrack Citizen Grievance Assistance Tool.\n"
        f"Please inspect and resolve at the earliest convenience.\n"
    )

    markdown = (
        f"### Grievance Summary for Official Portal Submission\n\n"
        f"- **Target Authority:** {dept_name}\n"
        f"- **CivicTrack Internal ID:** `{complaint.tracking_id}`\n"
        f"- **Category:** {complaint.category.replace('_', ' ').title()}\n"
        f"- **Priority:** {complaint.priority.capitalize()}\n"
        f"- **Location:** {complaint.address}{coords_text}\n\n"
        f"#### Description:\n"
        f"{complaint.description}\n\n"
        f"> *Notice: Copy this summary and paste it directly into the official portal.*"
    )

    return {
        "plain_text": plain_text,
        "markdown": markdown,
    }
