def test_citizen_create_complaint_and_routing(client, citizen_headers):
    payload = {
        "title": "Deep pothole dangerous for motorcyclists",
        "description": "Large asphalt crater near the corner of 5th street. Multiple cyclists have almost crashed.",
        "category": "potholes",
        "priority": "high",
        "address": "5th Street and Market Crossroad",
        "latitude": 37.7749,
        "longitude": -122.4194
    }
    res = client.post("/api/v1/complaints", json=payload, headers=citizen_headers)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["tracking_id"].startswith("CT-")
    assert data["status"] == "Submitted to CivicTrack"
    assert data["department"]["slug"] == "road-maintenance"
    assert data["recommended_department"]["slug"] == "road-maintenance"
    assert len(data["history"]) >= 1
    assert data["history"][0]["action_type"] == "initial_submission"


def test_citizen_cannot_view_another_citizens_private_complaint(client, citizen_headers, second_citizen_headers):
    # Priya creates a private grievance
    create_payload = {
        "title": "Private drainage complaint by Priya",
        "description": "Confidential details regarding backyard drainage blockage.",
        "category": "blocked_drains",
        "priority": "medium",
        "address": "404 Private Lane"
    }
    create_res = client.post("/api/v1/complaints", json=create_payload, headers=second_citizen_headers)
    assert create_res.status_code == 201
    complaint_id = create_res.json()["id"]

    # Alex (citizen) attempts to view Priya's complaint by ID -> MUST BE 403 Forbidden!
    unauthorized_res = client.get(f"/api/v1/complaints/{complaint_id}", headers=citizen_headers)
    assert unauthorized_res.status_code == 403
    assert "access forbidden" in unauthorized_res.json()["detail"].lower()


def test_admin_can_view_any_complaint(client, admin_headers, second_citizen_headers):
    # Citizen creates grievance
    create_payload = {
        "title": "Water pipeline burst on 2nd street",
        "description": "High pressure pipe broke and is flooding the pedestrian pathway.",
        "category": "water_leakage",
        "priority": "urgent",
        "address": "2nd Street, Block B"
    }
    create_res = client.post("/api/v1/complaints", json=create_payload, headers=second_citizen_headers)
    assert create_res.status_code == 201
    complaint_id = create_res.json()["id"]

    # Admin accesses the complaint -> MUST BE 200 OK
    admin_res = client.get(f"/api/v1/complaints/{complaint_id}", headers=admin_headers)
    assert admin_res.status_code == 200
    assert admin_res.json()["id"] == complaint_id


def test_admin_status_update_records_history(client, admin_headers, citizen_headers):
    # Citizen creates grievance
    create_res = client.post("/api/v1/complaints", json={
        "title": "Garbage dump near primary school",
        "description": "Garbage accumulating without bins near school entrance.",
        "category": "garbage_accumulation",
        "priority": "medium",
        "address": "12 School Road"
    }, headers=citizen_headers)
    complaint_id = create_res.json()["id"]

    # Admin updates status to In Progress with note
    update_payload = {
        "status": "In Progress",
        "status_note": "Inspection team assigned with front-loader truck."
    }
    patch_res = client.patch(f"/api/v1/complaints/{complaint_id}", json=update_payload, headers=admin_headers)
    assert patch_res.status_code == 200, patch_res.text
    data = patch_res.json()
    assert data["status"] == "In Progress"
    
    # Check history timeline records the change
    statuses_in_history = [h["new_status"] for h in data["history"]]
    assert "In Progress" in statuses_in_history
    assert any("Inspection team" in (h["notes"] or "") for h in data["history"])


def test_citizen_cannot_perform_admin_update(client, citizen_headers):
    # Citizen attempts to call admin patch endpoint -> 403 Forbidden
    patch_res = client.patch("/api/v1/complaints/1", json={"status": "Resolved"}, headers=citizen_headers)
    assert patch_res.status_code == 403
    assert "administrator access required" in patch_res.json()["detail"].lower()


def test_citizen_followup(client, citizen_headers):
    create_res = client.post("/api/v1/complaints", json={
        "title": "Broken street surface issue",
        "description": "Pavement damaged after cable laying work.",
        "category": "broken_road_surfaces",
        "priority": "low",
        "address": "90 Crescent Drive"
    }, headers=citizen_headers)
    complaint_id = create_res.json()["id"]

    # Citizen posts follow-up message
    followup_res = client.post(
        f"/api/v1/complaints/{complaint_id}/followup",
        json={"message": "Contractor left barriers in the road yesterday."},
        headers=citizen_headers
    )
    assert followup_res.status_code == 200

    # Verify history entry
    detail_res = client.get(f"/api/v1/complaints/{complaint_id}", headers=citizen_headers)
    history_actions = [h["action_type"] for h in detail_res.json()["history"]]
    assert "citizen_followup" in history_actions


def test_simulated_government_submission_contains_required_disclaimer(client, citizen_headers):
    create_res = client.post("/api/v1/complaints", json={
        "title": "Severe water pipe rupture",
        "description": "Massive water gusher on corner curb.",
        "category": "water_leakage",
        "priority": "urgent",
        "address": "Corner 3rd Ave"
    }, headers=citizen_headers)
    complaint_id = create_res.json()["id"]

    sim_res = client.post(
        f"/api/v1/complaints/{complaint_id}/simulate-official-submission",
        json={},
        headers=citizen_headers
    )
    assert sim_res.status_code == 200
    data = sim_res.json()
    assert data["submission_type"] == "simulated_adapter"
    assert data["disclaimer"] == "SIMULATED — NOT SENT TO GOVERNMENT"
    assert data["official_reference_number"].startswith("SIM-GOV-")
    assert data["is_verified"] is False


def test_record_citizen_official_submission_starts_unverified(client, citizen_headers):
    create_res = client.post("/api/v1/complaints", json={
        "title": "Clogged culvert drain",
        "description": "Culvert clogged by fallen branches.",
        "category": "blocked_drains",
        "priority": "high",
        "address": "Bridge Road culvert"
    }, headers=citizen_headers)
    complaint_id = create_res.json()["id"]

    rec_res = client.post(
        f"/api/v1/complaints/{complaint_id}/record-official-submission",
        json={"official_reference_number": "GOV-PORTAL-REF-998811"},
        headers=citizen_headers
    )
    assert rec_res.status_code == 200
    data = rec_res.json()
    assert data["official_reference_number"] == "GOV-PORTAL-REF-998811"
    assert data["is_verified"] is False  # Must start as unverified until admin/authority confirmation
    assert "unverified" in data["disclaimer"].lower() or "pending" in data["disclaimer"].lower()


def test_citizen_create_complaint_with_smart_location(client, citizen_headers):
    payload = {
        "title": "Severe pothole on 100 Feet Road",
        "description": "Deep asphalt crater causing traffic slowdown near 12th Main.",
        "category": "potholes",
        "priority": "high",
        "address": "100 Feet Road, Indiranagar, Bengaluru, Karnataka, 560038, India",
        "locality": "Indiranagar",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "geocoding_id": "osm_123456",
        "selection_method": "search"
    }
    res = client.post("/api/v1/complaints", json=payload, headers=citizen_headers)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["locality"] == "Indiranagar"
    assert data["latitude"] == 12.9784
    assert data["longitude"] == 77.6408
    assert data["geocoding_id"] == "osm_123456"
    assert data["selection_method"] == "search"

    # Also verify detail endpoint returns them
    detail_res = client.get(f"/api/v1/complaints/{data['id']}", headers=citizen_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["locality"] == "Indiranagar"
    assert detail["latitude"] == 12.9784
    assert detail["longitude"] == 77.6408
    assert detail["geocoding_id"] == "osm_123456"
    assert detail["selection_method"] == "search"

