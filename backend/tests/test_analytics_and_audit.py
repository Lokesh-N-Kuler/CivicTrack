def test_analytics_overview_computes_from_db(client, admin_headers):
    res = client.get("/api/v1/analytics/overview", headers=admin_headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["total_complaints"] >= 8
    assert "by_department" in data
    assert "by_category" in data
    assert "by_status" in data
    assert "by_priority" in data
    assert "timeline" in data
    assert len(data["by_department"]) >= 4


def test_audit_logs_accessible_only_by_admin(client, admin_headers, citizen_headers):
    # Citizen trying to access audit logs -> 403
    cit_res = client.get("/api/v1/audit-logs", headers=citizen_headers)
    assert cit_res.status_code == 403

    # Admin accessing audit logs -> 200
    admin_res = client.get("/api/v1/audit-logs", headers=admin_headers)
    assert admin_res.status_code == 200
    data = admin_res.json()
    assert "items" in data
    assert data["total"] >= 1


def test_reset_demo_data_endpoint(client, admin_headers, citizen_headers):
    # Citizen cannot reset demo data -> 403
    cit_res = client.post("/api/v1/demo/reset", headers=citizen_headers)
    assert cit_res.status_code == 403

    # Admin can reset demo data -> 200
    admin_res = client.post("/api/v1/demo/reset", headers=admin_headers)
    assert admin_res.status_code == 200
    assert "reset to baseline" in admin_res.json()["message"].lower()

    # Verify baseline 8 complaints are re-seeded
    list_res = client.get("/api/v1/complaints", headers=admin_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 8
