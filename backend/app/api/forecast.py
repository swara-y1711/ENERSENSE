"""
forecast.py
-----------
FastAPI router for XGBoost demand forecasting endpoints (Stage 3).

Exposes:
  - GET /api/forecast/current: Returns single-step demand forecast (kW), actual demand,
    and prediction error for the active replay timestamp.
  - GET /api/forecast/status: Returns model architecture, training periods, and verified evaluation metrics.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from app.services.forecast_service import (
    ForecastModelStatus,
    ForecastResult,
    forecast_service,
)

router = APIRouter(prefix="/forecast", tags=["Forecast"])


@router.get("/status", response_model=ForecastModelStatus)
async def get_forecast_model_status():
    """
    Returns the training details, feature vector structure, and verified evaluation metrics
    (MAE, RMSE, R² against persistence baseline) for the trained XGBoost model.
    """
    try:
        return forecast_service.get_status()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to read model status: {str(exc)}",
        )


@router.get("/current", response_model=ForecastResult)
async def get_current_forecast(
    timestamp: Optional[str] = Query(
        None,
        description="Optional ISO 8601 timestamp in October 2016. "
                    "If omitted, the active replay cursor timestamp is used.",
    )
):
    """
    Generates a 15-minute demand forecast (kW) using the trained XGBoost Regressor
    based on historical lags, Open-Meteo weather context, and calendar features.
    
    Clearly tagged as mode='historical_backtest'.
    """
    try:
        return forecast_service.predict_demand(timestamp=timestamp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forecast inference failed: {str(exc)}",
        )
