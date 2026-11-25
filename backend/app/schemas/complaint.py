from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.department import DepartmentResponse
from app.schemas.history import HistoryResponse
from app.schemas.image import ImageResponse
from app.schemas.external_submission import ExternalSubmissionResponse


class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    address: str = Field(..., min_length=3, max_length=500)
    locality: Optional[str] = Field(None, max_length=200)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    geocoding_id: Optional[str] = Field(None, max_length=100)
    selection_method: Optional[str] = Field(None, max_length=50)


class ComplaintCitizenFollowup(BaseModel):
    message: str = Field(..., min_length=3, max_length=1000)


class ComplaintUpdateAdmin(BaseModel):
    status: Optional[str] = None
    department_id: Optional[int] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    admin_notes: Optional[str] = None
    status_note: Optional[str] = None


class DuplicateSuggestion(BaseModel):
    id: int
    tracking_id: str
    title: str
    category: str
    status: str
    similarity_score: float  # 0.0 to 1.0
    distance_km: Optional[float] = None
    address: str
    created_at: datetime


class DepartmentRecommendationResponse(BaseModel):
    category: str
    department_id: Optional[int] = None
    department_name: str
    department_slug: str
    explanation: str


class ComplaintListItem(BaseModel):
    id: int
    tracking_id: str
    title: str
    category: str
    priority: str
    status: str
    address: str
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    is_demo: bool
    is_escalated: bool = False
    escalation_reason: Optional[str] = None
    hours_in_status: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ComplaintListResponse(BaseModel):
    items: List[ComplaintListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class ComplaintDetailResponse(BaseModel):
    id: int
    tracking_id: str
    citizen_id: int
    citizen_name: str
    citizen_email: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None
    recommended_department_id: Optional[int] = None
    recommended_department: Optional[DepartmentResponse] = None
    recommendation_reason: Optional[str] = None
    
    address: str
    locality: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geocoding_id: Optional[str] = None
    selection_method: Optional[str] = None
    
    is_demo: bool
    admin_notes: Optional[str] = None
    is_escalated: bool = False
    escalation_reason: Optional[str] = None
    hours_in_status: float = 0.0
    recommended_escalation_action: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    
    history: List[HistoryResponse] = []
    images: List[ImageResponse] = []
    external_submissions: List[ExternalSubmissionResponse] = []
    possible_duplicates: List[DuplicateSuggestion] = []

    model_config = ConfigDict(from_attributes=True)
