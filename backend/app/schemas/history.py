from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class HistoryResponse(BaseModel):
    id: int
    complaint_id: int
    previous_status: Optional[str] = None
    new_status: str
    acting_user_id: Optional[int] = None
    acting_user_name: Optional[str] = None
    action_type: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
