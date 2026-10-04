"""
peak.py
-------
FastAPI router for peak demand detection and upcoming peak anticipation (Stage 4).

Exposes:
  - GET /api/peak/current: Evaluates peak status ('below_peak', 'near_peak', 'predicted_peak')
    against empirical October 90th/95th percentile thresholds.
  - GET /api/peak/expected: Evaluates the upcoming 2-hour replay window to identify peak demand.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.peak_service import (
    ExpectedPeakWindowResult,
    PeakStatusResult,
    peak_service,
)

router = APIRouter(prefix="/peak", tags=["Peak Detection"])


@router.get("/current", response_model=PeakStatusResult)
async def get_current_peak_status(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp in October 2016. "
                    "If omitted, the active replay cursor timestamp is used.",
    )
):
    """
    Evaluates whether the forecasted demand crosses empirical historical peak thresholds:
      - 'below_peak': predicted demand < 90th percentile (56.1953 kW)
      - 'near_peak':  predicted demand >= 90th percentile and < 95th percentile (64.5560 kW)
      - 'predicted_peak': predicted demand >= 95th percentile
    """
    try:
        return peak_service.detect_peak(timestamp=timestamp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Peak detection failed: {str(exc)}",
        )


@router.get("/expected", response_model=ExpectedPeakWindowResult)
async def get_expected_peak_window(
    start_timestamp: Optional[str] = Query(
        None,
        description="Optional window start timestamp. If omitted, the active replay cursor is used.",
    ),
    window_hours: float = Query(
        2.0,
        ge=0.5,
        le=6.0,
        description="Duration of observation window in hours (defaults to 2.0 hours = 8 15-min intervals).",
    ),
):
    """
    Examines the upcoming replay window (default: next 2 hours) and identifies the highest
    predicted demand and whether an impending peak event is anticipated.
    """
    try:
        return peak_service.get_expected_peak(
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
            detail=f"Expected peak analysis failed: {str(exc)}",
        )
