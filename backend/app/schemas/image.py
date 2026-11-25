from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ImageResponse(BaseModel):
    id: int
    complaint_id: int
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
