"""
weather.py
----------
FastAPI router for Open-Meteo historical weather endpoints.

Exposes:
  - GET /api/weather/current: Returns historical weather context for Delhi, India.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.weather_service import (
    WeatherResponse,
    WeatherServiceError,
    weather_service,
)

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current", response_model=WeatherResponse)
async def get_current_weather(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp (e.g. '2016-10-05T14:15:00+05:30'). "
                    "If omitted, a sensible historical demo timestamp from October 2016 is used.",
    )
):
    """
    Returns historical weather observations (temperature, relative humidity, rainfall)
    from Open-Meteo for Delhi, India matching the requested historical replay timestamp.
    
    Data is cached in memory to ensure fast, deterministic responses without repeated API calls.
    """
    try:
        return weather_service.get_weather_for_timestamp(timestamp=timestamp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid timestamp parameter: {str(exc)}",
        )
    except WeatherServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Weather service unavailable: {str(exc)}",
        )
