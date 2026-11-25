from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class ExternalSubmissionRecord(Base):
    __tablename__ = "external_submission_records"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True)
    authority_id = Column(Integer, ForeignKey("authority_directory.id", ondelete="SET NULL"), nullable=True)
    
    submission_type = Column(String(50), nullable=False)  # 'citizen_recorded', 'simulated_adapter', 'api_adapter'
    official_reference_number = Column(String(100), nullable=True, index=True)
    is_verified = Column(Boolean, default=False, nullable=False)  # False if citizen-entered and not confirmed
    status = Column(String(50), default="submitted", nullable=False)  # 'pending', 'submitted', 'confirmed', 'rejected'
    
    submission_payload = Column(Text, nullable=True)
    response_payload = Column(Text, nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    
    # Must explicitly state disclaimer
    disclaimer = Column(String(255), default="SIMULATED — NOT SENT TO GOVERNMENT", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="external_submissions")
    authority = relationship("AuthorityDirectory", back_populates="external_submissions")

    __table_args__ = (
        Index("ix_submission_complaint_type", "complaint_id", "submission_type"),
    )
