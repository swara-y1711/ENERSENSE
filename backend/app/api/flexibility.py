"""
flexibility.py
--------------
FastAPI router for Flexible Demand Estimation and Grid Event Simulation (Stage 4).

Exposes:
  - GET /api/flexibility/current: Estimates potential flexible demand based on historical slot baselines.
  - POST /api/flexibility/simulate: Evaluates a hypothetical grid reduction event (e.g. 20 kW over 18:00–20:00).
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.flexibility_service import (
    FlexibilityResult,
    GridEventSimulationRequest,
    GridEventSimulationResponse,
    flexibility_service,
)

router = APIRouter(prefix="/flexibility", tags=["Flexible Demand"])


@router.get("/current", response_model=FlexibilityResult)
async def get_current_flexibility(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp in October 2016. "
                    "If omitted, the active replay cursor timestamp is used.",
    )
):
    """
    Estimates potential flexible demand (kW) compared to historical slot median baselines.
    Clearly labeled as an empirical estimate, not guaranteed controllable load.
    """
    try:
        return flexibility_service.estimate_flexibility(timestamp=timestamp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Flexibility estimation failed: {str(exc)}",
        )


@router.post("/simulate", response_model=GridEventSimulationResponse)
async def simulate_grid_event(request: GridEventSimulationRequest):
    """
    Executes a what-if scenario simulation for a hypothetical grid demand reduction event.
    Evaluates whether the requested reduction (kW) is achievable based on potential flexibility.
    
    Does NOT dispatch commands or control building equipment.
    """
    try:
        return flexibility_service.simulate_grid_event(request=request)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Grid event simulation failed: {str(exc)}",
        )
