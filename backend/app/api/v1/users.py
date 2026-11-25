from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_password_hash
from app.api.deps import get_current_user
from app.models.user import User
from app.models.complaint import Complaint
from app.schemas.user import UserUpdate, UserResponse

router = APIRouter()


@router.get("/profile")
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = db.query(func.count(Complaint.id)).filter(Complaint.citizen_id == current_user.id).scalar() or 0
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.citizen_id == current_user.id, Complaint.status == "Resolved").scalar() or 0
    in_progress = db.query(func.count(Complaint.id)).filter(Complaint.citizen_id == current_user.id, Complaint.status == "In Progress").scalar() or 0
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.citizen_id == current_user.id, Complaint.status == "Rejected").scalar() or 0
    open_count = total - (resolved + rejected)

    return {
        "user": UserResponse.model_validate(current_user),
        "stats": {
            "total_complaints": total,
            "resolved_complaints": resolved,
            "in_progress_complaints": in_progress,
            "open_complaints": open_count,
        }
    }


@router.put("/profile", response_model=UserResponse)
def update_profile(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name.strip()
    if user_in.phone_number is not None:
        current_user.phone_number = user_in.phone_number.strip()
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
