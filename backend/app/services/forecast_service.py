"""
forecast_service.py
-------------------
ENERSENSE Demand Forecasting Service (Stage 3).

Loads the trained XGBoost Regressor model from backend/model_artifacts/
and provides real-time single-step demand forecasts (kW) using:
  - Historical I-BLEND lagged power measurements (15m, 30m, 60m, 1d)
  - Historical Open-Meteo weather context (temperature, humidity, rainfall)
  - Temporal calendar features (hour, minute, day of week, weekend, day of month)

Key Principles:
  1. Historical Backtest Honesty:
     Clearly labels all forecasts as DEMO / HISTORICAL BACKTEST predictions.
     Never claims this is live real-time operational prediction.
  2. No Target Leakage:
     Features are strictly computed from past intervals (shift >= 1).
  3. Real Provenance:
     All input telemetry originates from data/processed/academic_demo_15min.csv
     and Open-Meteo historical observations for Delhi. No values are fabricated.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import joblib
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from app.services.replay_service import replay_service
from app.services.weather_service import WeatherContextSummary, weather_service

# Paths
BASE_DIR = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = BASE_DIR / "model_artifacts"
MODEL_PATH = ARTIFACTS_DIR / "xgboost_demand_model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"


class ForecastResult(BaseModel):
    """Forecast prediction response schema."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    actual_demand_kw: Optional[float] = Field(None, description="Actual demand from I-BLEND in kW")
    predicted_demand_kw: float = Field(..., description="Forecasted demand in kW by XGBoost")
    error_kw: Optional[float] = Field(None, description="Prediction error (actual - predicted) in kW")
    error_percent: Optional[float] = Field(None, description="Absolute percentage error")
    model: str = Field("XGBoost", description="Forecasting model name")
    mode: str = Field("historical_backtest", description="Replay backtest mode")
    weather: Optional[WeatherContextSummary] = Field(None, description="Weather context during observation")


class PeriodDetails(BaseModel):
    start: str
    end: str
    records: int


class ForecastModelMetrics(BaseModel):
    mae: float
    rmse: float
    r2: float


class ForecastModelStatus(BaseModel):
    """Status and performance evaluation of the forecasting model."""
    model_available: bool = True
    model_name: str
    algorithm: str
    feature_count: int
    features: List[str]
    training_period: PeriodDetails
    test_period: PeriodDetails
    metrics: ForecastModelMetrics
    baseline_metrics: ForecastModelMetrics
    mode: str = "historical_backtest"


class DemandForecastService:
    """
    Manages model loading, feature preparation, and demand inference.
    """

    def __init__(
        self,
        model_path: Path = MODEL_PATH,
        metadata_path: Path = METADATA_PATH,
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model = None
        self.metadata: Dict[str, Any] = {}
        self._feature_store: Dict[str, Dict[str, Any]] = {}
        
        try:
            self._load_model_artifacts()
            self._initialize_feature_store()
        except FileNotFoundError as e:
            print(f"Could not load ML models on init, artifacts missing: {e}")
        except Exception as e:
            print(f"Error loading ML models on init: {e}")

    def _load_model_artifacts(self):
        """Loads serialized XGBoost model and metadata from disk."""
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model artifact not found at {self.model_path}. "
                "Run 'python scripts/train_forecast_model.py' to generate artifacts."
            )
        if not self.metadata_path.exists():
            raise FileNotFoundError(f"Metadata file not found at {self.metadata_path}.")

        self.model = joblib.load(self.model_path)
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

    def _initialize_feature_store(self):
        """
        Pre-computes lag and calendar features across continuous 2016 telemetry
        for all October records to allow instantaneous O(1) inference at runtime.
        """
        # Candidate paths for processed CSV
        candidates = [
            BASE_DIR.parent / "data" / "processed" / "academic_demo_15min.csv",
            Path("data/processed/academic_demo_15min.csv").resolve(),
            Path("../data/processed/academic_demo_15min.csv").resolve(),
        ]
        csv_path = None
        for p in candidates:
            if p.exists():
                csv_path = p
                break

        if not csv_path:
            raise FileNotFoundError(f"Processed CSV not found in {candidates}")

        df = pd.read_csv(csv_path)
        df["dt"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("dt").reset_index(drop=True)

        # Lags on continuous timeline (no target leakage)
        df["demand_lag_15m"] = df["demand_kw"].shift(1)
        df["demand_lag_30m"] = df["demand_kw"].shift(2)
        df["demand_lag_60m"] = df["demand_kw"].shift(4)
        df["demand_lag_1d"] = df["demand_kw"].shift(96)

        df["hour"] = df["dt"].dt.hour
        df["minute"] = df["dt"].dt.minute
        df["day_of_week"] = df["dt"].dt.dayofweek
        df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
        df["day_of_month"] = df["dt"].dt.day

        # Filter for October 2016 backtest period
        oct_df = df[(df["dt"] >= "2016-10-01") & (df["dt"] < "2016-11-01")].copy().reset_index(drop=True)

        store = {}
        for _, row in oct_df.iterrows():
            ts = str(row["timestamp"])
            store[ts] = {
                "timestamp": ts,
                "demand_kw": float(row["demand_kw"]),
                "demand_lag_15m": float(row["demand_lag_15m"]),
                "demand_lag_30m": float(row["demand_lag_30m"]),
                "demand_lag_60m": float(row["demand_lag_60m"]),
                "demand_lag_1d": float(row["demand_lag_1d"]),
                "hour": int(row["hour"]),
                "minute": int(row["minute"]),
                "day_of_week": int(row["day_of_week"]),
                "is_weekend": int(row["is_weekend"]),
                "day_of_month": int(row["day_of_month"]),
            }
        self._feature_store = store

    def get_status(self) -> ForecastModelStatus:
        """Returns metadata and verified backtest performance metrics of the model."""
        return ForecastModelStatus(
            model_available=(self.model is not None),
            model_name=self.metadata.get("model_name", "XGBoost Regressor"),
            algorithm=self.metadata.get("algorithm", "xgboost.XGBRegressor"),
            feature_count=self.metadata.get("feature_count", 12),
            features=self.metadata.get("features", []),
            training_period=PeriodDetails(**self.metadata.get("training_period", {})),
            test_period=PeriodDetails(**self.metadata.get("test_period", {})),
            metrics=ForecastModelMetrics(**self.metadata.get("metrics", {})),
            baseline_metrics=ForecastModelMetrics(**self.metadata.get("baseline_metrics", {})),
            mode="historical_backtest",
        )

    def predict_demand(self, timestamp: Optional[str] = None) -> ForecastResult:
        """
        Generates a demand forecast (kW) for the specified timestamp (or current replay cursor).
        """
        # Resolve target timestamp
        if timestamp:
            ts_lookup = timestamp
        else:
            current_rec = replay_service.get_current_record()
            ts_lookup = current_rec.timestamp

        # Normalize lookup key if needed
        ts_clean = ts_lookup.strip().replace("Z", "+00:00")
        record_data = self._feature_store.get(ts_clean)

        if not record_data:
            # Try partial matching on ISO prefix
            for k in self._feature_store:
                if k.startswith(ts_lookup) or k == ts_clean:
                    record_data = self._feature_store[k]
                    break

        if not record_data:
            raise ValueError(
                f"Timestamp '{timestamp}' not found in October 2016 backtest dataset. "
                "Forecast backtest is available for timestamps between 2016-10-01 and 2016-10-31."
            )

        # Retrieve real weather context from weather_service
        w_resp = weather_service.get_weather_for_timestamp(record_data["timestamp"])
        weather_summary = WeatherContextSummary(
            temperature_c=w_resp.weather.temperature_c,
            relative_humidity_percent=w_resp.weather.relative_humidity_percent,
            rainfall_mm=w_resp.weather.rainfall_mm,
            source=w_resp.source,
        )

        # Assemble feature vector in the exact order model was trained on
        feature_vector = {
            "demand_lag_15m": record_data["demand_lag_15m"],
            "demand_lag_30m": record_data["demand_lag_30m"],
            "demand_lag_60m": record_data["demand_lag_60m"],
            "demand_lag_1d": record_data["demand_lag_1d"],
            "temperature_c": weather_summary.temperature_c,
            "relative_humidity_percent": weather_summary.relative_humidity_percent,
            "rainfall_mm": weather_summary.rainfall_mm,
            "hour": record_data["hour"],
            "minute": record_data["minute"],
            "day_of_week": record_data["day_of_week"],
            "is_weekend": record_data["is_weekend"],
            "day_of_month": record_data["day_of_month"],
        }

        feature_cols = self.metadata.get("features", list(feature_vector.keys()))
        X = pd.DataFrame([feature_vector])[feature_cols]

        pred_kw = float(self.model.predict(X)[0])
        actual_kw = record_data.get("demand_kw")

        error_kw = None
        error_pct = None
        if actual_kw is not None:
            error_kw = round(actual_kw - pred_kw, 4)
            if actual_kw > 0:
                error_pct = round(abs(error_kw) / actual_kw * 100, 2)

        return ForecastResult(
            timestamp=record_data["timestamp"],
            actual_demand_kw=round(actual_kw, 4) if actual_kw is not None else None,
            predicted_demand_kw=round(pred_kw, 4),
            error_kw=error_kw,
            error_percent=error_pct,
            model="XGBoost",
            mode="historical_backtest",
            weather=weather_summary,
        )


# Singleton forecast service instance
forecast_service = DemandForecastService()
