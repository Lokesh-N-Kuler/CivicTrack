from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.department import Department


# Master category mapping with human explanations
CATEGORY_ROUTING_MAP: Dict[str, Dict[str, Any]] = {
    # Road Maintenance
    "potholes": {
        "slug": "road-maintenance",
        "name": "Road Maintenance Department",
        "reason": "Categorized as hazardous road surface defect (pothole). Recommended to Road Maintenance Department for asphalt inspection and hot-mix patching.",
    },
    "damaged_roads": {
        "slug": "road-maintenance",
        "name": "Road Maintenance Department",
        "reason": "Categorized as structural roadway deterioration or cave-in. Recommended to Road Maintenance Department for roadbed resurfacing assessment.",
    },
    "broken_road_surfaces": {
        "slug": "road-maintenance",
        "name": "Road Maintenance Department",
        "reason": "Categorized as broken pavement, curb damage, or crumbling surface. Recommended to Road Maintenance Department for civil repair.",
    },
    
    # Waste Management
    "garbage_accumulation": {
        "slug": "waste-management",
        "name": "Waste Management Department",
        "reason": "Categorized as uncollected municipal solid waste. Recommended to Waste Management Department for sanitary removal and site sanitation.",
    },
    "overflowing_bins": {
        "slug": "waste-management",
        "name": "Waste Management Department",
        "reason": "Categorized as an overflowing community waste receptacle. Recommended to Waste Management Department for urgent bin emptying.",
    },
    "waste_collection": {
        "slug": "waste-management",
        "name": "Waste Management Department",
        "reason": "Categorized as scheduled door-to-door or street waste collection failure. Recommended to Waste Management Department for route review.",
    },
    
    # Water Supply
    "water_leakage": {
        "slug": "water-supply",
        "name": "Water Supply Department",
        "reason": "Categorized as pressurized potable water pipeline rupture. Recommended to Water Supply Department for emergency valve control and repair.",
    },
    "damaged_pipelines": {
        "slug": "water-supply",
        "name": "Water Supply Department",
        "reason": "Categorized as physical transmission water pipeline damage. Recommended to Water Supply Department for infrastructure rehabilitation.",
    },
    "water_disruption": {
        "slug": "water-supply",
        "name": "Water Supply Department",
        "reason": "Categorized as complete water supply stoppage or critical low pressure. Recommended to Water Supply Department for network diagnosis.",
    },
    
    # Drainage and Sewage
    "blocked_drains": {
        "slug": "drainage-sewage",
        "name": "Drainage and Sewage Department",
        "reason": "Categorized as silt or debris obstruction in storm drain. Recommended to Drainage and Sewage Department for mechanical desilting.",
    },
    "sewage_overflow": {
        "slug": "drainage-sewage",
        "name": "Drainage and Sewage Department",
        "reason": "Categorized as hazardous sewage overflow or manhole backflow. Recommended to Drainage and Sewage Department for high-priority decontamination and vacuum clearance.",
    },
    "waterlogging": {
        "slug": "drainage-sewage",
        "name": "Drainage and Sewage Department",
        "reason": "Categorized as street storm water stagnation due to drainage bottleneck. Recommended to Drainage and Sewage Department for pump deployment.",
    },
}


def recommend_department(db: Session, category: str, text_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Determines the recommended department based on grievance category and context,
    retrieves the department record from the database, and provides the explanation.
    """
    category_normalized = category.lower().strip().replace(" ", "_").replace("-", "_")
    mapping = CATEGORY_ROUTING_MAP.get(category_normalized)

    if not mapping and text_context:
        # Fallback keyword scan if unknown category
        lower_text = text_context.lower()
        if any(w in lower_text for w in ["pothole", "tar", "asphalt", "road", "pavement", "crack"]):
            mapping = CATEGORY_ROUTING_MAP["potholes"]
        elif any(w in lower_text for w in ["garbage", "trash", "waste", "bin", "dump", "litter"]):
            mapping = CATEGORY_ROUTING_MAP["garbage_accumulation"]
        elif any(w in lower_text for w in ["pipe", "leak", "tap", "drinking water", "water supply"]):
            mapping = CATEGORY_ROUTING_MAP["water_leakage"]
        elif any(w in lower_text for w in ["drain", "sewer", "sewage", "gutter", "waterlog", "flood"]):
            mapping = CATEGORY_ROUTING_MAP["blocked_drains"]

    if not mapping:
        mapping = {
            "slug": "road-maintenance",
            "name": "Road Maintenance Department",
            "reason": "General civic issue default recommendation for initial triage.",
        }

    # Query DB for corresponding department record
    dept = db.query(Department).filter(Department.slug == mapping["slug"]).first()
    if not dept:
        # Fallback to name search
        dept = db.query(Department).filter(Department.name.ilike(f"%{mapping['name']}%")).first()

    return {
        "department_id": dept.id if dept else None,
        "department_name": dept.name if dept else mapping["name"],
        "department_slug": dept.slug if dept else mapping["slug"],
        "explanation": mapping["reason"],
    }
