"""
replay.py
---------
FastAPI router for historical I-BLEND telemetry replay endpoints.

Exposes:
  - GET /api/replay/status: Replay stream metadata and current stream position.
  - GET /api/replay/next: Streams the next sequential telemetry record from October 2016.
  - GET /api/replay/sample: Retrieves a window of N sequential records for demonstration.
  - GET /api/replay/current: Combined telemetry + ToD tariff evaluation endpoint.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.replay_service import (
    CombinedReplayRecord,
    ReplayRecord,
    ReplayStatus,
    evaluate_telemetry_tariff,
    replay_service,
)

router = APIRouter(prefix="/replay", tags=["Replay"])


@router.get("/status", response_model=ReplayStatus)
async def get_replay_status():
    """
    Returns metadata about the active I-BLEND October 2016 replay stream,
    including total records, interval, and current cursor position.
    """
    return replay_service.get_status()


@router.get("/next", response_model=ReplayRecord)
async def get_next_telemetry():
    """
    Returns the next sequential telemetry reading from the October 2016 I-BLEND dataset
    and advances the replay cursor by 1.
    
    Clearly tagged as mode='historical_replay' with replay=True.
    """
    try:
        return replay_service.get_next_record()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Replay stream error: {str(e)}",
        )


@router.get("/sample", response_model=List[ReplayRecord])
async def get_replay_sample(
    limit: int = Query(
        10,
        ge=1,
        le=500,
        description="Number of sequential October 2016 records to return (defaults to 10).",
    )
):
    """
    Returns the next N sequential October 2016 telemetry records without advancing
    the active cursor.
    """
    return replay_service.get_sample_records(limit=limit, advance=False)


@router.get("/current", response_model=CombinedReplayRecord)
async def get_current_combined_telemetry(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO timestamp to query a specific October 2016 reading. "
                    "If omitted, the current replay cursor reading is used.",
    )
):
    """
    Combined demo endpoint:
    Returns the telemetry record from the historical I-BLEND dataset paired with
    the evaluated Time-of-Day tariff period ('off_peak' with -20% rebate, 'normal' with 0%).
    
    Does not calculate monetary figures because base_energy_rate is unverified (null).
    """
    if timestamp:
        record = replay_service.get_record_by_timestamp(timestamp)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No October 2016 telemetry record found matching timestamp '{timestamp}'.",
            )
    else:
        record = replay_service.get_current_record()

    return evaluate_telemetry_tariff(record)
