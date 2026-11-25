def test_register_citizen_success(client):
    payload = {
        "email": "newuser@example.com",
        "full_name": "New Test User",
        "password": "ValidPassword123!",
        "phone_number": "+1-555-9988"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["role"] == "citizen"


def test_register_duplicate_email_fails(client):
    payload = {
        "email": "citizen@example.com",  # Already exists from seed
        "full_name": "Duplicate User",
        "password": "Password123!"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_register_short_password_fails(client):
    payload = {
        "email": "shortpass@example.com",
        "full_name": "Short Pass User",
        "password": "123"  # Less than min 8
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422


def test_login_success(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "citizen@example.com",
        "password": "Password123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "citizen"


def test_login_invalid_password_fails(client):
    response = client.post("/api/v1/auth/login", json={
        "email": "citizen@example.com",
        "password": "WrongPassword999!"
    })
    assert response.status_code == 401
    assert "invalid email or password" in response.json()["detail"].lower()


def test_protected_endpoint_without_token_fails(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_profile_retrieval_success(client, citizen_headers):
    response = client.get("/api/v1/users/profile", headers=citizen_headers)
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert "stats" in data
    assert data["user"]["email"] == "citizen@example.com"
