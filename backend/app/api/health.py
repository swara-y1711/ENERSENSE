import logging
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.db.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()


class HealthResponse(BaseModel):
    status: str


class DbHealthResponse(BaseModel):
    status: str
    database: str
    buildings_count: int


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint for the ENERSENSE backend API.
    Returns status: ok when the service is healthy.
    """
    return {"status": "ok"}


@router.get("/health/db", response_model=DbHealthResponse, tags=["Health"])
async def db_health_check():
    """
    Database health-check endpoint.
    Performs a SELECT read on the 'buildings' table to verify connection via Supabase or SQLAlchemy.
    """
    # 1. Try Supabase Python SDK client first if configured
    supabase = get_supabase_client()
    if supabase:
        try:
            response = supabase.table("buildings").select("*", count="exact").execute()
            count = response.count if response.count is not None else len(response.data)
            return {
                "status": "ok",
                "database": "connected",
                "buildings_count": count,
            }
        except Exception as e:
            logger.warning(f"Supabase REST query failed, trying SQLAlchemy fallback: {e}")

    # 2. Try SQLAlchemy database connection
    try:
        from app.db.database import SessionLocal, init_db
        from app.db.models import Building
        init_db()
        db = SessionLocal()
        try:
            count = db.query(Building).count()
            return {
                "status": "ok",
                "database": "connected",
                "buildings_count": count,
            }
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database query to buildings table failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error: Failed to query buildings table.",
        )
