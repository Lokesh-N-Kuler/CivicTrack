import math
import difflib
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.schemas.complaint import DuplicateSuggestion


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two GPS coordinates in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)


def text_similarity(str1: str, str2: str) -> float:
    """
    Calculates normalized string similarity ratio between 0.0 and 1.0.
    """
    if not str1 or not str2:
        return 0.0
    s = difflib.SequenceMatcher(None, str1.lower().strip(), str2.lower().strip())
    return round(s.ratio(), 3)


def find_possible_duplicates(
    db: Session,
    complaint: Complaint,
    threshold_similarity: float = 0.55,
    max_distance_km: float = 1.0,
    limit: int = 5
) -> List[DuplicateSuggestion]:
    """
    Searches for similar complaints based on category, text similarity,
    and geographic proximity.
    NOTE: All suggestions are for human review only. Never automatically deletes or merges.
    """
    # Query complaints in the same or related category, excluding the current complaint itself
    query = db.query(Complaint).filter(Complaint.id != complaint.id)
    candidates = query.all()

    matches: List[DuplicateSuggestion] = []

    for c in candidates:
        same_category = c.category == complaint.category
        
        # Calculate text similarity
        title_sim = text_similarity(complaint.title, c.title)
        desc_sim = text_similarity(complaint.description[:200], c.description[:200])
        combined_text_sim = (title_sim * 0.7) + (desc_sim * 0.3)

        # Calculate geo distance if coordinates exist
        dist_km: Optional[float] = None
        has_geo = (
            complaint.latitude is not None
            and complaint.longitude is not None
            and c.latitude is not None
            and c.longitude is not None
        )
        if has_geo:
            dist_km = haversine_distance_km(
                complaint.latitude, complaint.longitude,
                c.latitude, c.longitude
            )

        # Scoring heuristics
        is_match = False
        score = combined_text_sim

        # If geographically close and same category, lower text threshold
        if same_category and has_geo and dist_km is not None and dist_km <= max_distance_km:
            if combined_text_sim >= 0.35:
                is_match = True
                score = round(max(combined_text_sim, 0.75 - (dist_km * 0.2)), 3)
        elif same_category and combined_text_sim >= threshold_similarity:
            is_match = True
        elif combined_text_sim >= 0.70:
            is_match = True

        if is_match:
            matches.append(DuplicateSuggestion(
                id=c.id,
                tracking_id=c.tracking_id,
                title=c.title,
                category=c.category,
                status=c.status,
                similarity_score=score,
                distance_km=dist_km,
                address=c.address,
                created_at=c.created_at
            ))

    # Sort descending by similarity score
    matches.sort(key=lambda m: m.similarity_score, reverse=True)
    return matches[:limit]
