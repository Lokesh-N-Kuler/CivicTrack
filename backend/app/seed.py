import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.department import Department
from app.models.authority import AuthorityDirectory
from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.models.external_submission import ExternalSubmissionRecord
from app.models.notification import Notification
from app.models.audit_log import AuditLog


def seed_database(db: Session = None):
    """
    Idempotent database seeder.
    Can be run repeatedly without creating duplicate records.
    """
    should_close = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        should_close = True

    try:
        now = datetime.now(timezone.utc)
        print("[-] Seeding CivicTrack database...")

        # 1. Seed Users (Demo accounts)
        demo_users_data = [
            {
                "email": "admin@example.com",
                "full_name": "Demo Administrator",
                "role": "admin",
                "phone": "+1-555-0199",
                "password": "AdminPassword123!"
            },
            {
                "email": "citizen@example.com",
                "full_name": "Alex Citizen",
                "role": "citizen",
                "phone": "+1-555-0123",
                "password": "Password123!"
            },
            {
                "email": "priya.citizen@example.com",
                "full_name": "Priya Sharma",
                "role": "citizen",
                "phone": "+1-555-0145",
                "password": "Password123!"
            }
        ]

        users_by_email = {}
        for u in demo_users_data:
            existing_user = db.query(User).filter(User.email == u["email"]).first()
            if not existing_user:
                new_user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    phone_number=u["phone"],
                    is_active=True,
                    created_at=now - timedelta(days=30),
                    updated_at=now - timedelta(days=30),
                )
                db.add(new_user)
                db.flush()
                users_by_email[u["email"]] = new_user
                print(f"    [+] Created user: {u['email']} ({u['role']})")
            else:
                users_by_email[u["email"]] = existing_user
                print(f"    [*] User exists: {u['email']}")

        # 2. Seed 4 Standard Demo Departments
        demo_departments = [
            {
                "name": "Road Maintenance Department",
                "slug": "road-maintenance",
                "description": "Responsible for municipal roadways, asphalt repair, pothole filling, surface resurfacing, and pavement safety.",
                "contact_email": "roads.demo@civictrack.local",
                "contact_phone": "+1-555-ROAD-01",
            },
            {
                "name": "Waste Management Department",
                "slug": "waste-management",
                "description": "Oversees municipal solid waste collection, street sanitation, public bin clearance, and recycling operations.",
                "contact_email": "waste.demo@civictrack.local",
                "contact_phone": "+1-555-WASTE-02",
            },
            {
                "name": "Water Supply Department",
                "slug": "water-supply",
                "description": "Manages potable water distribution pipelines, main leak repairs, supply pressure, and pipeline maintenance.",
                "contact_email": "water.demo@civictrack.local",
                "contact_phone": "+1-555-WATER-03",
            },
            {
                "name": "Drainage and Sewage Department",
                "slug": "drainage-sewage",
                "description": "Maintains municipal storm drainage conduits, culverts, sanitary sewer lines, and waterlogging abatement pumps.",
                "contact_email": "drainage.demo@civictrack.local",
                "contact_phone": "+1-555-DRAIN-04",
            },
        ]

        depts_by_slug = {}
        for d in demo_departments:
            dept = db.query(Department).filter(Department.slug == d["slug"]).first()
            if not dept:
                dept = Department(
                    name=d["name"],
                    slug=d["slug"],
                    description=d["description"],
                    contact_email=d["contact_email"],
                    contact_phone=d["contact_phone"],
                    is_active=True,
                    created_at=now - timedelta(days=30)
                )
                db.add(dept)
                db.flush()
                print(f"    [+] Created department: {d['name']}")
            else:
                print(f"    [*] Department exists: {d['name']}")
            depts_by_slug[d["slug"]] = dept

        # 3. Seed Authority Directory Entries
        demo_authorities = [
            {
                "department_slug": "road-maintenance",
                "name": "Metropolitan Road & Transport Works Bureau (Demo)",
                "jurisdiction": "Central Urban District (Demo)",
                "categories": "potholes,damaged_roads,broken_road_surfaces",
                "website": "https://roads.example.gov.local",
                "portal_url": "https://roads.example.gov.local/grievance-portal",
                "phone": "+1-555-800-ROAD",
                "email": "grievance.roads@example.gov.local",
                "source_url": "https://roads.example.gov.local/directory",
                "is_verified": False,
                "integration_type": "simulated",
                "integration_availability": "simulated_only",
                "notes": "Demonstration authority record. Unverified for production legal submission."
            },
            {
                "department_slug": "waste-management",
                "name": "Municipal Sanitation & Waste Directorate (Demo)",
                "jurisdiction": "City Sanitation Zone A (Demo)",
                "categories": "garbage_accumulation,overflowing_bins,waste_collection",
                "website": "https://sanitation.example.gov.local",
                "portal_url": "https://sanitation.example.gov.local/clean-city",
                "phone": "+1-555-800-WASTE",
                "email": "clean.city@example.gov.local",
                "source_url": "https://sanitation.example.gov.local/contacts",
                "is_verified": False,
                "integration_type": "simulated",
                "integration_availability": "simulated_only",
                "notes": "Demonstration directory listing. Integration adapter operates in simulation mode."
            },
            {
                "department_slug": "water-supply",
                "name": "Urban Water Supply & Sewerage Board (Demo)",
                "jurisdiction": "Greater Metro Region (Demo)",
                "categories": "water_leakage,damaged_pipelines,water_disruption",
                "website": "https://waterboard.example.gov.local",
                "portal_url": "https://waterboard.example.gov.local/report-burst",
                "phone": "+1-555-800-WATER",
                "email": "emergency.pipeline@example.gov.local",
                "source_url": "https://waterboard.example.gov.local/public-notices",
                "is_verified": False,
                "integration_type": "simulated",
                "integration_availability": "simulated_only",
                "notes": "Demonstration directory entry. Live municipal link unverified."
            },
            {
                "department_slug": "drainage-sewage",
                "name": "Stormwater Drainage & Sewer Commission (Demo)",
                "jurisdiction": "Metro Flood Management Zone (Demo)",
                "categories": "blocked_drains,sewage_overflow,waterlogging",
                "website": "https://drainage.example.gov.local",
                "portal_url": "https://drainage.example.gov.local/storm-helpline",
                "phone": "+1-555-800-DRAIN",
                "email": "drainage.helpline@example.gov.local",
                "source_url": "https://drainage.example.gov.local/help",
                "is_verified": False,
                "integration_type": "simulated",
                "integration_availability": "simulated_only",
                "notes": "Demonstration directory entry for storm runoff triage."
            }
        ]

        authorities_by_dept = {}
        for a in demo_authorities:
            existing_auth = db.query(AuthorityDirectory).filter(AuthorityDirectory.name == a["name"]).first()
            dept_obj = depts_by_slug.get(a["department_slug"])
            if not existing_auth:
                new_auth = AuthorityDirectory(
                    department_id=dept_obj.id if dept_obj else None,
                    name=a["name"],
                    jurisdiction=a["jurisdiction"],
                    supported_categories=a["categories"],
                    official_website=a["website"],
                    official_portal_url=a["portal_url"],
                    public_contact_phone=a["phone"],
                    public_contact_email=a["email"],
                    source_url=a["source_url"],
                    last_verification_date=now - timedelta(days=15),
                    is_verified=a["is_verified"],
                    integration_type=a["integration_type"],
                    integration_availability=a["integration_availability"],
                    notes=a["notes"],
                    created_at=now - timedelta(days=20)
                )
                db.add(new_auth)
                db.flush()
                authorities_by_dept[a["department_slug"]] = new_auth
                print(f"    [+] Created authority: {a['name']}")
            else:
                authorities_by_dept[a["department_slug"]] = existing_auth
                print(f"    [*] Authority exists: {a['name']}")

        # 4. Seed At Least 8 Clearly Labeled Fictional Demo Complaints
        # Distributed across all four departments, with varied priorities and statuses
        primary_citizen = users_by_email["citizen@example.com"]
        second_citizen = users_by_email["priya.citizen@example.com"]

        demo_complaints_data = [
            # 1. Road Maintenance - Potholes (In Progress, Escalate demonstration)
            {
                "tracking_id": "CT-2026-000001",
                "citizen_id": primary_citizen.id,
                "title": "Severe pothole at Oakwood Crossroad near School Crossing",
                "description": "Deep asphalt depression measuring approximately 4 feet wide and 6 inches deep right after the school pedestrian crossing. Poses hazardous risk to two-wheelers and buses.",
                "category": "potholes",
                "priority": "high",
                "status": "In Progress",
                "department_slug": "road-maintenance",
                "address": "Intersection of Oakwood Ave & 4th Street, Ward 12",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "hours_ago": 36,  # > 24 hours ago in progress -> Demo escalation will trigger!
                "history_notes": "Assigned to Pavement Repair Crew Alpha. Hot-mix scheduled."
            },
            # 2. Road Maintenance - Damaged Road Surface (Submitted)
            {
                "tracking_id": "CT-2026-000002",
                "citizen_id": primary_citizen.id,
                "title": "Cracked pavement and broken surface on Maple Lane",
                "description": "Over 50 meters of bitumen surface has completely broken down following recent utility trench work. Gravel is loose on the carriageway.",
                "category": "broken_road_surfaces",
                "priority": "medium",
                "status": "Submitted to CivicTrack",
                "department_slug": "road-maintenance",
                "address": "142 Maple Lane, Industrial Suburb",
                "latitude": 37.7833,
                "longitude": -122.4167,
                "hours_ago": 4,
                "history_notes": "Grievance received and awaiting field survey inspection."
            },
            # 3. Waste Management - Overflowing Bins (Assigned)
            {
                "tracking_id": "CT-2026-000003",
                "citizen_id": primary_citizen.id,
                "title": "Garbage overflowing near Central Park bus shelter",
                "description": "Three municipal public bins have been overflowing for over 48 hours. Plastic bags and domestic food waste are scattering into the public bus shelter area.",
                "category": "overflowing_bins",
                "priority": "urgent",
                "status": "Assigned",
                "department_slug": "waste-management",
                "address": "Central Park Entrance, Bus Shelter #8, Main Road",
                "latitude": 37.7699,
                "longitude": -122.4469,
                "hours_ago": 18,
                "history_notes": "Assigned to Sanitation Vehicle Route 4 for expedited clearance."
            },
            # 4. Waste Management - Missed Collection (Resolved)
            {
                "tracking_id": "CT-2026-000004",
                "citizen_id": second_citizen.id,
                "title": "Missed residential waste collection on 5th Ward block",
                "description": "Tuesday morning curbside waste pickup was missed for odd-numbered residences from #101 to #155 on Elm Avenue.",
                "category": "waste_collection",
                "priority": "low",
                "status": "Resolved",
                "department_slug": "waste-management",
                "address": "101-155 Elm Avenue, Ward 5",
                "latitude": 37.7558,
                "longitude": -122.4449,
                "hours_ago": 72,
                "resolved_hours_ago": 24,
                "history_notes": "Special recovery truck dispatched. Curbside pickup completed."
            },
            # 5. Water Supply - Water Leakage (Official Submission Confirmed)
            {
                "tracking_id": "CT-2026-000005",
                "citizen_id": primary_citizen.id,
                "title": "Potable water leaking from underground main pipeline on Pine St",
                "description": "Clean drinking water is steadily welling up through sidewalk pavers. Water has been continuously gushing into the roadside channel for 6 hours.",
                "category": "water_leakage",
                "priority": "urgent",
                "status": "Official Submission Confirmed",
                "department_slug": "water-supply",
                "address": "Outside Building #45, Pine Street, Commercial Hub",
                "latitude": 37.7915,
                "longitude": -122.4089,
                "hours_ago": 16,
                "history_notes": "Official portal submission recorded. Reference: SIM-GOV-2026-WTR789 (SIMULATED — NOT SENT TO GOVERNMENT)."
            },
            # 6. Water Supply - Supply Interruption (Under Review)
            {
                "tracking_id": "CT-2026-000006",
                "citizen_id": second_citizen.id,
                "title": "Unscheduled water supply disruption in Sector 7",
                "description": "No water supply since 6:00 AM across apartments in Sector 7 without prior maintenance notice. Pressure completely zero.",
                "category": "water_disruption",
                "priority": "high",
                "status": "Under Review",
                "department_slug": "water-supply",
                "address": "Sector 7 Residential Complex, Block C & D",
                "latitude": 37.7600,
                "longitude": -122.4200,
                "hours_ago": 8,
                "history_notes": "Contacted municipal valve operator to check upstream pump status."
            },
            # 7. Drainage & Sewage - Blocked Drain (In Progress)
            {
                "tracking_id": "CT-2026-000007",
                "citizen_id": primary_citizen.id,
                "title": "Blocked storm drain causing rainwater ponding and waterlogging",
                "description": "The main curb inlet storm drain is packed with construction silt and garden clippings. Street gets submerged under 8 inches of water with moderate rain.",
                "category": "blocked_drains",
                "priority": "high",
                "status": "In Progress",
                "department_slug": "drainage-sewage",
                "address": "Corner of 11th Street and Bayview Boulevard",
                "latitude": 37.7650,
                "longitude": -122.3950,
                "hours_ago": 28,  # > 24 hours in progress -> Demo escalation
                "history_notes": "Hydro-jetting unit dispatched to clear curb inlet."
            },
            # 8. Drainage & Sewage - Sewage Overflow (Authority Recommended)
            {
                "tracking_id": "CT-2026-000008",
                "citizen_id": second_citizen.id,
                "title": "Sanitary sewer manhole overflow near Community Market Square",
                "description": "Contaminated wastewater is seeping past manhole cover with noxious odors. Direct biological hazard for pedestrians and street food vendors.",
                "category": "sewage_overflow",
                "priority": "urgent",
                "status": "Authority Recommended",
                "department_slug": "drainage-sewage",
                "address": "Opposite Stall 14, Old Market Square, Downtown",
                "latitude": 37.7850,
                "longitude": -122.4060,
                "hours_ago": 10,
                "history_notes": "Automated triage recommended Drainage and Sewage Department. Pending team deployment."
            }
        ]

        for comp_data in demo_complaints_data:
            existing_c = db.query(Complaint).filter(Complaint.tracking_id == comp_data["tracking_id"]).first()
            dept_obj = depts_by_slug.get(comp_data["department_slug"])
            created_dt = now - timedelta(hours=comp_data["hours_ago"])
            updated_dt = created_dt
            resolved_dt = (now - timedelta(hours=comp_data["resolved_hours_ago"])) if "resolved_hours_ago" in comp_data else None

            if not existing_c:
                c = Complaint(
                    tracking_id=comp_data["tracking_id"],
                    citizen_id=comp_data["citizen_id"],
                    title=comp_data["title"],
                    description=comp_data["description"],
                    category=comp_data["category"],
                    priority=comp_data["priority"],
                    status=comp_data["status"],
                    department_id=dept_obj.id if dept_obj else None,
                    recommended_department_id=dept_obj.id if dept_obj else None,
                    recommendation_reason=f"Recommended to {dept_obj.name if dept_obj else 'department'} based on complaint categorization.",
                    address=comp_data["address"],
                    locality=comp_data.get("locality", "Bengaluru"),
                    latitude=comp_data["latitude"],
                    longitude=comp_data["longitude"],
                    selection_method="seed",
                    is_demo=True,  # Clearly marked as fictional demo data!
                    admin_notes="Fictional demonstration complaint for evaluation and testing.",
                    created_at=created_dt,
                    updated_at=updated_dt,
                    resolved_at=resolved_dt
                )
                db.add(c)
                db.flush()

                # Add initial history entry
                db.add(ComplaintHistory(
                    complaint_id=c.id,
                    previous_status=None,
                    new_status="Submitted to CivicTrack",
                    acting_user_id=comp_data["citizen_id"],
                    action_type="initial_submission",
                    notes="Fictional demo grievance registered.",
                    created_at=created_dt
                ))

                # Add second history entry if status changed
                if comp_data["status"] != "Submitted to CivicTrack":
                    db.add(ComplaintHistory(
                        complaint_id=c.id,
                        previous_status="Submitted to CivicTrack",
                        new_status=comp_data["status"],
                        acting_user_id=users_by_email["admin@example.com"].id,
                        action_type="status_change",
                        notes=comp_data["history_notes"],
                        created_at=created_dt + timedelta(hours=2)
                    ))

                # If status is Official Submission Confirmed, add simulated external submission record
                if comp_data["status"] == "Official Submission Confirmed":
                    db.add(ExternalSubmissionRecord(
                        complaint_id=c.id,
                        authority_id=authorities_by_dept.get("water-supply", None).id if "water-supply" in authorities_by_dept else None,
                        submission_type="simulated_adapter",
                        official_reference_number="SIM-GOV-2026-WTR789",
                        is_verified=False,
                        status="submitted",
                        disclaimer="SIMULATED — NOT SENT TO GOVERNMENT",
                        response_payload='{"simulation_notice": "DEMO MUNICIPAL ADAPTER ONLY. NO REAL GOVERNMENT RECORD"}',
                        idempotency_key=f"seed_sim_{c.id}",
                        created_at=created_dt + timedelta(hours=3)
                    ))

                # Add citizen in-app notification
                db.add(Notification(
                    user_id=comp_data["citizen_id"],
                    complaint_id=c.id,
                    title="Grievance Registered (Demo Data)",
                    message=f"Demo grievance #{c.tracking_id} '{c.title}' was successfully created.",
                    created_at=created_dt
                ))

                print(f"    [+] Created demo complaint: {c.tracking_id} - {c.title[:40]}...")
            else:
                print(f"    [*] Complaint exists: {comp_data['tracking_id']}")

        # 5. Add initial audit log entry
        existing_log = db.query(AuditLog).filter(AuditLog.action == "SEED_DEMO_DATA").first()
        if not existing_log:
            db.add(AuditLog(
                user_id=users_by_email["admin@example.com"].id,
                action="SEED_DEMO_DATA",
                resource_type="system",
                resource_id="seed",
                details="Seeded initial baseline demo users, departments, and complaints.",
                created_at=now
            ))

        db.commit()
        print("[OK] CivicTrack database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[!] Seeding failed: {str(e)}")
        raise e
    finally:
        if should_close:
            db.close()


if __name__ == "__main__":
    seed_database()
