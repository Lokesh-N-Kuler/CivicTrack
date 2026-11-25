from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.models.complaint import Complaint
from app.core.config import settings


def evaluate_escalation(complaint: Complaint) -> Dict[str, Any]:
    """
    Evaluates whether a complaint meets demonstration escalation criteria.
    Explicitly labeled as 'Demo escalation rule'.
    """
    now = datetime.now(timezone.utc)
    # Ensure complaint dates are timezone-aware for comparison
    created_at = complaint.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    updated_at = complaint.updated_at
    if updated_at.tzinfo is None:
        updated_at = updated_at.replace(tzinfo=timezone.utc)

    # Use updated_at as proxy for when current status was entered
    hours_in_status = round((now - updated_at).total_seconds() / 3600.0, 1)

    is_escalated = False
    escalation_reason = None
    recommended_action = None

    if complaint.status in ["Resolved", "Rejected"]:
        # Resolved or rejected complaints do not escalate
        return {
            "is_escalated": False,
            "escalation_reason": None,
            "hours_in_status": hours_in_status,
            "recommended_action": None,
            "rule_label": "Demo escalation rule — Non-binding simulation timer"
        }

    # Rule 1: Urgent priority not assigned or reviewed within 12 hours
    if complaint.priority == "urgent" and complaint.status in ["Submitted to CivicTrack", "Under Review"] and hours_in_status >= 12.0:
        is_escalated = True
        escalation_reason = (
            f"Demo escalation rule: High-priority/Urgent grievance has remained unassigned for "
            f"{hours_in_status} hours. Target triage SLA in simulation is 12 hours."
        )
        recommended_action = "Assign directly to duty supervisor and initiate priority triage."

    # Rule 2: In Progress beyond configurable demo threshold (e.g. 24 hours)
    elif complaint.status == "In Progress" and hours_in_status >= settings.DEMO_ESCALATION_HOURS:
        is_escalated = True
        escalation_reason = (
            f"Demo escalation rule: Work order has been in 'In Progress' for {hours_in_status} hours "
            f"(simulated threshold: {settings.DEMO_ESCALATION_HOURS}h). "
            f"Note: This reflects an internal demonstration metric, not a statutory municipal breach."
        )
        recommended_action = "Review field progress with assigned department foreman and request status update."

    # Rule 3: Submitted but untouched for more than 48 hours
    elif complaint.status in ["Submitted to CivicTrack", "Under Review"] and hours_in_status >= 48.0:
        is_escalated = True
        escalation_reason = (
            f"Demo escalation rule: Unreviewed for {hours_in_status} hours. "
            f"Exceeds simulated 48h initial review guideline."
        )
        recommended_action = "Verify complaint details and route to recommended department."

    return {
        "is_escalated": is_escalated,
        "escalation_reason": escalation_reason,
        "hours_in_status": hours_in_status,
        "recommended_action": recommended_action,
        "rule_label": "Demo escalation rule — Non-binding simulation timer"
    }
