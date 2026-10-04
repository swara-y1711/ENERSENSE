"""
tariff.py
---------
FastAPI router for Time-of-Day (ToD) tariff endpoints.

Exposes:
  - GET /api/tariff/current: Get applicable tariff period ('peak', 'off_peak', or 'normal'),
    rate (if verified/configured), and regulatory provenance for a given timestamp.
  - GET /api/tariff/config: Get the tariff configuration, utility provenance, and period schedules.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.services.tariff_service import (
    TariffConfig,
    TariffPeriodResult,
    get_default_tariff_config,
    get_tariff_for_timestamp,
)

router = APIRouter(prefix="/tariff", tags=["Tariff"])


@router.get("/current", response_model=TariffPeriodResult)
async def get_current_tariff(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp (e.g. '2026-10-04T15:30:00+05:30' or '2026-10-04T10:00:00Z'). "
                    "If omitted, the current Asia/Kolkata time is used.",
    ),
    base_energy_rate: Optional[float] = Query(
        None,
        description="Optional base energy rate in ₹/kWh. If omitted, default unverified rate (None) is used.",
    ),
):
    """
    Returns the applicable Time-of-Day tariff period ('peak', 'off_peak', or 'normal'),
    rate (if configured or verified), demand charge, and official utility/DERC provenance.
    
    Timezone Safety:
    Timestamps are converted and evaluated strictly against Asia/Kolkata (IST, UTC+05:30).
    """
    try:
        config = None
        if base_energy_rate is not None:
            config = get_default_tariff_config().model_copy(update={"base_energy_rate": base_energy_rate})
        return get_tariff_for_timestamp(timestamp=timestamp, tariff_config=config)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timestamp parameter: {str(e)}",
        )


@router.get("/config", response_model=TariffConfig)
async def get_tariff_configuration(
    building_name: Optional[str] = Query(
        None,
        description="Optional building identifier (defaults to 'Academic Building').",
    ),
    base_energy_rate: Optional[float] = Query(
        None,
        description="Optional base energy rate in ₹/kWh to test dynamic rate calculations.",
    ),
):
    """
    Returns the Time-of-Day tariff configuration for the facility.
    
    Exposes official DERC/BRPL provenance, surcharge and rebate multipliers (+20% / -20%),
    and period definitions without hardcoded invented fallback rates.
    """
    config = get_default_tariff_config(building_name=building_name)
    if base_energy_rate is not None:
        config = config.model_copy(update={"base_energy_rate": base_energy_rate})
    return config
