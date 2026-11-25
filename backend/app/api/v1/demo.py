from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_admin, get_client_ip
from app.seed import seed_database
from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.models.image import ComplaintImage
from app.models.external_submission import ExternalSubmissionRecord
from app.models.notification import Notification
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("/reset")
def reset_demo_data(
    request: Request,
    admin=Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Administrator-only endpoint to reset demonstration records to fresh seed state.
    Strictly disabled in production environments.
    """
    if settings.is_production:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo data reset is strictly prohibited in production environments."
        )

    # Delete all existing complaints and associated dependent records
    # (keeps user accounts and department masters intact, re-seeds fresh demo data)
    db.query(ExternalSubmissionRecord).delete()
    db.query(ComplaintImage).delete()
    db.query(ComplaintHistory).delete()
    db.query(Notification).delete()
    db.query(Complaint).delete()
    db.commit()

    # Re-run idempotent seed
    seed_database(db=db)

    log_audit_event(
        db=db,
        action="RESET_DEMO_DATA",
        resource_type="system",
        user_id=admin.id,
        details={"environment": settings.ENVIRONMENT},
        ip_address=get_client_ip(request)
    )

    return {"message": "Demo data has been successfully reset to baseline demonstration state."}
