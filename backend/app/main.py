import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1 import api_router
from app.seed import seed_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("civictrack")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"Upload directory initialized at: {settings.UPLOAD_DIR}")
    
    # Create DB tables if not present
    logger.info(f"Connecting to database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo dataset if empty
    try:
        from app.models.department import Department
        from app.core.database import SessionLocal
        db = SessionLocal()
        if db.query(Department).count() == 0:
            logger.info("Initializing baseline demonstration data...")
            seed_database(db=db)
        db.close()
    except Exception as e:
        logger.warning(f"Auto-seed check encountered notice: {str(e)}")

    yield
    # Shutdown
    logger.info("CivicTrack backend shutdown complete.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description=(
        "CivicTrack — Transparent Civic Grievance Reporting & Tracking Platform. "
        "Provides citizen grievance filing, intelligent department recommendation, "
        "chronological timeline auditing, and simulated/official government routing."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
origins = settings.BACKEND_CORS_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "sqlite_local_fallback" if settings.is_sqlite else "postgresql",
        "environment": settings.ENVIRONMENT
    }


@app.get("/", tags=["Root"])
def root_info():
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "documentation": "/docs",
        "api_v1": settings.API_V1_STR,
        "database_mode": "SQLite (Demo fallback)" if settings.is_sqlite else "PostgreSQL (Production)",
        "notice": "Demonstration platform with verified government routing boundaries."
    }
