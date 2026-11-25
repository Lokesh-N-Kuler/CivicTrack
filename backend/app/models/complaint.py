from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    tracking_id = Column(String(50), unique=True, index=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    priority = Column(String(20), default="medium", nullable=False, index=True)
    status = Column(String(50), default="Submitted to CivicTrack", nullable=False, index=True)
    
    # Department associations
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    recommended_department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    recommendation_reason = Column(Text, nullable=True)
    
    # Location
    address = Column(String(500), nullable=False)
    locality = Column(String(200), nullable=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    geocoding_id = Column(String(100), nullable=True)
    selection_method = Column(String(50), default="search", nullable=True)
    
    # Operational & Demo flags
    is_demo = Column(Boolean, default=False, nullable=False, index=True)
    admin_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="complaints", foreign_keys=[department_id])
    recommended_department = relationship("Department", back_populates="recommended_complaints", foreign_keys=[recommended_department_id])
    
    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan", order_by="ComplaintHistory.created_at.desc()")
    images = relationship("ComplaintImage", back_populates="complaint", cascade="all, delete-orphan")
    external_submissions = relationship("ExternalSubmissionRecord", back_populates="complaint", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="complaint", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_complaint_status_dept", "status", "department_id"),
        Index("ix_complaint_category_created", "category", "created_at"),
    )
