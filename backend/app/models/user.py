from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="citizen", nullable=False, index=True)  # 'citizen', 'admin', 'super_admin'
    phone_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Blocking management
    is_blocked = Column(Boolean, default=False, nullable=False, index=True)
    blocked_at = Column(DateTime, nullable=True)
    blocked_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    blocked_reason = Column(String(500), nullable=True)

    # Soft deletion management
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    deletion_reason = Column(String(500), nullable=True)

    # Login tracking
    last_login_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    # Relationships
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    history_entries = relationship("ComplaintHistory", back_populates="acting_user", foreign_keys="ComplaintHistory.acting_user_id")
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")

    # Self-referencing relationships
    blocked_by = relationship("User", remote_side=[id], foreign_keys=[blocked_by_id])
    deleted_by = relationship("User", remote_side=[id], foreign_keys=[deleted_by_id])
