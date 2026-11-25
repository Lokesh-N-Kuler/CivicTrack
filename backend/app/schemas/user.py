from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    role: Optional[str] = "citizen"  # Only admin creation endpoint allows setting role to admin


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=50)
    password: Optional[str] = Field(None, min_length=8, max_length=128)


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    is_blocked: bool = False
    is_deleted: bool = False
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# Admin User Management Schemas
class UserBlockRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)


class UserDeleteRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


class UserAdminUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, pattern="^(citizen|admin|super_admin)$")
    is_active: Optional[bool] = None


class UserAdminItem(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    role: str
    is_active: bool
    is_blocked: bool
    blocked_at: Optional[datetime] = None
    blocked_reason: Optional[str] = None
    blocked_by_name: Optional[str] = None
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    deletion_reason: Optional[str] = None
    deleted_by_name: Optional[str] = None
    last_login_at: Optional[datetime] = None
    complaints_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserAdminListResponse(BaseModel):
    items: List[UserAdminItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class UserDetailComplaintItem(BaseModel):
    id: int
    tracking_id: str
    title: str
    category: str
    priority: str
    status: str
    locality: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserDetailAuditItem(BaseModel):
    id: int
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
    ip_address: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserDetailAdminResponse(BaseModel):
    user: UserAdminItem
    stats: Dict[str, int]
    complaints: List[UserDetailComplaintItem]
    recent_activity: List[UserDetailAuditItem]
