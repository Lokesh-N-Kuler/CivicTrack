from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.complaint import Complaint
from app.models.department import Department
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    StatCount,
    TimelinePoint,
    GeoPoint
)
from app.services.escalation_service import evaluate_escalation

router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total = db.query(func.count(Complaint.id)).scalar() or 0
    resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == "Resolved").scalar() or 0
    rejected = db.query(func.count(Complaint.id)).filter(Complaint.status == "Rejected").scalar() or 0
    in_prog = db.query(func.count(Complaint.id)).filter(Complaint.status == "In Progress").scalar() or 0
    open_count = total - (resolved + rejected)

    # Calculate average resolution time for resolved complaints
    # In SQLite or Postgres, we can do this in python or SQL
    resolved_complaints = (
        db.query(Complaint.created_at, Complaint.resolved_at)
        .filter(Complaint.status == "Resolved", Complaint.resolved_at.isnot(None))
        .all()
    )
    
    avg_hours = 0.0
    if resolved_complaints:
        total_seconds = sum(
            (c.resolved_at - c.created_at).total_seconds()
            for c in resolved_complaints
            if c.resolved_at and c.created_at and c.resolved_at > c.created_at
        )
        avg_hours = round((total_seconds / len(resolved_complaints)) / 3600.0, 1)

    # Complaints by Department
    dept_rows = (
        db.query(Department.name, func.count(Complaint.id))
        .join(Complaint, Complaint.department_id == Department.id, isouter=True)
        .group_by(Department.name)
        .all()
    )
    by_department = [
        StatCount(name=row[0], count=row[1] or 0)
        for row in dept_rows
    ]

    # Complaints by Category
    cat_rows = (
        db.query(Complaint.category, func.count(Complaint.id))
        .group_by(Complaint.category)
        .all()
    )
    by_category = [
        StatCount(name=row[0].replace("_", " ").title(), count=row[1] or 0)
        for row in cat_rows
    ]

    # Complaints by Status
    status_rows = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    by_status = [
        StatCount(name=row[0], count=row[1] or 0)
        for row in status_rows
    ]

    # Complaints by Priority
    priority_rows = (
        db.query(Complaint.priority, func.count(Complaint.id))
        .group_by(Complaint.priority)
        .all()
    )
    by_priority = [
        StatCount(name=row[0].capitalize(), count=row[1] or 0)
        for row in priority_rows
    ]

    # Complaints created over time (e.g. past 7-14 days)
    # Generate points grouped by date string YYYY-MM-DD
    all_complaints = db.query(Complaint.created_at, Complaint.resolved_at, Complaint.status).all()
    now = datetime.now(timezone.utc)
    daily_stats = {}
    for i in range(14, -1, -1):
        day_str = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_stats[day_str] = {"created": 0, "resolved": 0}

    for c in all_complaints:
        c_date = c.created_at.strftime("%Y-%m-%d") if c.created_at else None
        if c_date and c_date in daily_stats:
            daily_stats[c_date]["created"] += 1
        
        if c.resolved_at:
            r_date = c.resolved_at.strftime("%Y-%m-%d")
            if r_date in daily_stats:
                daily_stats[r_date]["resolved"] += 1

    timeline = [
        TimelinePoint(date=k, count=v["created"], resolved=v["resolved"])
        for k, v in sorted(daily_stats.items())
    ]

    # Geographic distribution where valid coordinates exist
    geo_complaints = (
        db.query(Complaint)
        .filter(Complaint.latitude.isnot(None), Complaint.longitude.isnot(None))
        .limit(100)
        .all()
    )
    geo_distribution = [
        GeoPoint(
            id=c.id,
            tracking_id=c.tracking_id,
            title=c.title,
            latitude=c.latitude,
            longitude=c.longitude,
            status=c.status,
            category=c.category,
            priority=c.priority,
            address=c.address,
            locality=c.locality,
            department_name=c.department.name if c.department else None
        )
        for c in geo_complaints
    ]

    # Escalated count check
    active_complaints = (
        db.query(Complaint)
        .filter(Complaint.status.notin_(["Resolved", "Rejected"]))
        .all()
    )
    escalated_count = sum(1 for c in active_complaints if evaluate_escalation(c)["is_escalated"])

    return AnalyticsOverviewResponse(
        total_complaints=total,
        open_complaints=open_count,
        in_progress_complaints=in_prog,
        resolved_complaints=resolved,
        rejected_complaints=rejected,
        average_resolution_hours=avg_hours,
        escalated_count=escalated_count,
        by_department=by_department,
        by_category=by_category,
        by_status=by_status,
        by_priority=by_priority,
        timeline=timeline,
        geo_distribution=geo_distribution
    )
