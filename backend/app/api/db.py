from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.persistence_service import get_db_status, get_demo_building

router = APIRouter(tags=["Database"])


@router.get("/db/status")
async def read_db_status(db: Session = Depends(get_db)):
    """
    Returns database connection status, table availability, and row counts
    for the ENERSENSE persistence layer.
    """
    res = get_db_status(db)
    if res.get("database") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query failed: {res.get('error')}",
        )
    return res


@router.get("/db/building")
async def read_demo_building(db: Session = Depends(get_db)):
    """
    Returns the primary ENERSENSE demo building record.
    """
    building = get_demo_building(db)
    if not building:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo building record not found in database. Run the seed script to initialize.",
        )
    return building
