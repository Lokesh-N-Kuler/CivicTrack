from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class AuthorityBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    jurisdiction: str = Field(..., min_length=2, max_length=255)
    supported_categories: str  # Comma-separated or JSON
    official_website: Optional[str] = None
    official_portal_url: Optional[str] = None
    public_contact_phone: Optional[str] = None
    public_contact_email: Optional[str] = None
    source_url: Optional[str] = None
    last_verification_date: Optional[datetime] = None
    is_verified: bool = False
    integration_type: str = "none"  # 'none', 'simulated', 'official_api'
    integration_availability: str = "unverified"
    notes: Optional[str] = None


class AuthorityCreate(AuthorityBase):
    department_id: Optional[int] = None


class AuthorityUpdate(BaseModel):
    name: Optional[str] = None
    jurisdiction: Optional[str] = None
    supported_categories: Optional[str] = None
    official_website: Optional[str] = None
    official_portal_url: Optional[str] = None
    public_contact_phone: Optional[str] = None
    public_contact_email: Optional[str] = None
    source_url: Optional[str] = None
    last_verification_date: Optional[datetime] = None
    is_verified: Optional[bool] = None
    integration_type: Optional[str] = None
    integration_availability: Optional[str] = None
    notes: Optional[str] = None
    department_id: Optional[int] = None


class AuthorityResponse(AuthorityBase):
    id: int
    department_id: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
