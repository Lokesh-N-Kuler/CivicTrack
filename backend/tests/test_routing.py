import pytest


@pytest.mark.parametrize("category,expected_dept_slug", [
    ("potholes", "road-maintenance"),
    ("damaged_roads", "road-maintenance"),
    ("broken_road_surfaces", "road-maintenance"),
    ("garbage_accumulation", "waste-management"),
    ("overflowing_bins", "waste-management"),
    ("waste_collection", "waste-management"),
    ("water_leakage", "water-supply"),
    ("damaged_pipelines", "water-supply"),
    ("water_disruption", "water-supply"),
    ("blocked_drains", "drainage-sewage"),
    ("sewage_overflow", "drainage-sewage"),
    ("waterlogging", "drainage-sewage"),
])
def test_all_department_recommendations(client, category, expected_dept_slug):
    res = client.get(f"/api/v1/departments/recommend?category={category}")
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["category"] == category
    assert data["department_slug"] == expected_dept_slug
    assert len(data["explanation"]) > 10
