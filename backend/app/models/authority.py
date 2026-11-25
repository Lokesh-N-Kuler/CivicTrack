from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class AuthorityDirectory(Base):
    __tablename__ = "authority_directory"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    jurisdiction = Column(String(255), nullable=False)
    supported_categories = Column(Text, nullable=False)  # Comma-separated or JSON list of categories
    
    official_website = Column(String(500), nullable=True)
    official_portal_url = Column(String(500), nullable=True)
    public_contact_phone = Column(String(100), nullable=True)
    public_contact_email = Column(String(255), nullable=True)
    
    source_url = Column(String(500), nullable=True)
    last_verification_date = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    
    integration_type = Column(String(50), default="none", nullable=False)  # 'none', 'simulated', 'official_api'
    integration_availability = Column(String(50), default="unverified", nullable=False)  # 'available', 'unverified', 'simulated_only', 'maintenance'
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)

    department = relationship("Department", back_populates="authorities")
    external_submissions = relationship("ExternalSubmissionRecord", back_populates="authority")
