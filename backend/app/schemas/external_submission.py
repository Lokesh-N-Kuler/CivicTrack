from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ExternalSubmissionRecordCreate(BaseModel):
    official_reference_number: str = Field(..., min_length=2, max_length=100)
    authority_id: Optional[int] = None
    notes: Optional[str] = None


class ExternalSubmissionSimulateRequest(BaseModel):
    authority_id: Optional[int] = None


class ExternalSubmissionResponse(BaseModel):
    id: int
    complaint_id: int
    authority_id: Optional[int] = None
    authority_name: Optional[str] = None
    submission_type: str
    official_reference_number: Optional[str] = None
    is_verified: bool
    status: str
    disclaimer: str
    response_payload: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
