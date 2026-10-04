"""
impact.py
---------
FastAPI router for Stage 6 Impact Verification & Baseline Comparison.

Exposes:
  - GET /api/impact/current: Single-interval comparison of actual demand vs. historical baseline vs. simulated scenario.
  - POST /api/impact/simulate: Multi-interval what-if scenario simulation over a historical time window.

Disclaimers:
  This router provides hypothetical scenario calculations only. It does not control equipment,
  claim guaranteed historical savings, or invent monetary rates.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.impact_service import (
    CurrentImpactResult,
    ImpactSimulationRequest,
    ImpactSimulationResponse,
    impact_service,
)

router = APIRouter(prefix="/impact", tags=["Impact & Verification"])


@router.get("/current", response_model=CurrentImpactResult)
async def get_current_impact(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp in October 2016. If omitted, the active replay cursor timestamp is used.",
    ),
    requested_reduction_kw: float = Query(
        0.0,
        description="Hypothetical requested demand reduction in kW to simulate (defaults to 0.0).",
    ),
):
    """
    Returns the actual historical demand, historical slot baseline, XGBoost prediction,
    and simulated scenario demand for the current replay timestamp.
    """
    try:
        return impact_service.get_current_impact(
            timestamp=timestamp,
            requested_reduction_kw=requested_reduction_kw,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Impact calculation failed: {str(exc)}",
        )


@router.post("/simulate", response_model=ImpactSimulationResponse)
async def simulate_impact_scenario(request: ImpactSimulationRequest):
    """
    Simulates a multi-interval grid-event scenario over [start_timestamp, end_timestamp],
    capping applied reductions by estimated potential flexibility and calculating kWh energy impact.
    Persists simulation summary result to impact_simulations table.
    """
    try:
        res = impact_service.simulate_impact_scenario(request)
        # Stage 8: Persist simulation summary
        try:
            from app.db.database import SessionLocal
            from app.services.persistence_service import get_or_create_building, persist_impact_simulation
            db = SessionLocal()
            try:
                b = get_or_create_building(db)
                persist_impact_simulation(
                    db,
                    building_id=b.id,
                    sim_data={
                        "start_timestamp": res.start_timestamp,
                        "end_timestamp": res.end_timestamp,
                        "requested_reduction_kw": res.requested_reduction_kw,
                        "total_simulated_reduction_kwh": res.total_simulated_reduction_kwh,
                        "average_simulated_reduction_kw": res.average_simulated_reduction_kw,
                    },
                )
            finally:
                db.close()
        except Exception as p_err:
            import logging
            logging.getLogger(__name__).warning(f"Failed to persist impact simulation: {p_err}")

        return res
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Impact scenario simulation failed: {str(exc)}",
        )
