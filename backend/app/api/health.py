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
    Supabase database health-check endpoint.
    Performs a SELECT read on the 'buildings' table to verify connection.
    """
    supabase = get_supabase_client()
    if not supabase:
        logger.error("Supabase client failed to initialize or missing credentials.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed: Supabase client not initialized.",
        )

    try:
        response = supabase.table("buildings").select("*", count="exact").execute()
        count = response.count if response.count is not None else len(response.data)
        return {
            "status": "ok",
            "database": "connected",
            "buildings_count": count,
        }
    except Exception as e:
        logger.error(f"Supabase query to buildings table failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection error: Failed to query buildings table.",
        )
