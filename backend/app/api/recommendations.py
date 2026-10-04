"""
recommendations.py
------------------
FastAPI router for Stage 5 advisory recommendations.

Exposes:
  - GET /api/recommendations/current: Rule-based recommendations for the active replay timestamp.
  - GET /api/recommendations/expected: Recommendations for the upcoming replay/forecast window.

Does not expose POST/control endpoints. Recommendations are advisory only.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.recommendation_service import (
    RecommendationBundle,
    recommendation_service,
)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/current", response_model=RecommendationBundle)
async def get_current_recommendations(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp in October 2016. "
                    "If omitted, the active replay cursor timestamp is used.",
    )
):
    """
    Returns advisory recommendations for the current replay interval using
    Stage 1–4 forecast, peak, flexibility, tariff, and weather context.
    """
    try:
        return recommendation_service.get_current_recommendations(timestamp=timestamp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendation generation failed: {str(exc)}",
        )


@router.get("/expected", response_model=RecommendationBundle)
async def get_expected_recommendations(
    start_timestamp: Optional[str] = Query(
        None,
        description="Optional window start timestamp. If omitted, the active replay cursor is used.",
    ),
    window_hours: float = Query(
        2.0,
        ge=0.5,
        le=6.0,
        description="Look-ahead window in hours (defaults to 2.0 hours).",
    ),
):
    """
    Returns advisory recommendations for the upcoming relevant period, focused on
    the interval with the highest predicted demand in the replay window.
    """
    try:
        return recommendation_service.get_expected_recommendations(
            start_timestamp=start_timestamp,
            window_hours=window_hours,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Expected recommendation generation failed: {str(exc)}",
        )
