from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.departments import router as departments_router
from app.api.v1.complaints import router as complaints_router
from app.api.v1.authorities import router as authorities_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.demo import router as demo_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users_router, prefix="/users", tags=["Users & Profile"])
api_router.include_router(departments_router, prefix="/departments", tags=["Departments"])
api_router.include_router(complaints_router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(authorities_router, prefix="/authorities", tags=["Authorities"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(audit_logs_router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(demo_router, prefix="/demo", tags=["Demo Management"])
