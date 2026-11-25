import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Ensure test DB is distinct
os.environ["DATABASE_URL"] = "sqlite:///./test_civictrack.db"
os.environ["ENVIRONMENT"] = "testing"

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.seed import seed_database

test_engine = create_engine(
    "sqlite:///./test_civictrack.db",
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    seed_database(db=db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("test_civictrack.db"):
        try:
            os.remove("test_civictrack.db")
        except Exception:
            pass


@pytest.fixture()
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def admin_headers(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "admin@example.com",
        "password": "AdminPassword123!"
    })
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def citizen_headers(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "citizen@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def second_citizen_headers(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "priya.citizen@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
