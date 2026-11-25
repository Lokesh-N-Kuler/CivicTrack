from typing import List, Optional
from pydantic import BaseModel


class StatCount(BaseModel):
    name: str
    count: int
    color: Optional[str] = None


class TimelinePoint(BaseModel):
    date: str
    count: int
    resolved: int


class GeoPoint(BaseModel):
    id: int
    tracking_id: str
    title: str
    latitude: float
    longitude: float
    status: str
    category: str
    priority: Optional[str] = None
    address: Optional[str] = None
    locality: Optional[str] = None
    department_name: Optional[str] = None


class AnalyticsOverviewResponse(BaseModel):
    total_complaints: int
    open_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    rejected_complaints: int
    average_resolution_hours: Optional[float] = 0.0
    escalated_count: int
    
    by_department: List[StatCount]
    by_category: List[StatCount]
    by_status: List[StatCount]
    by_priority: List[StatCount]
    timeline: List[TimelinePoint]
    geo_distribution: List[GeoPoint]
