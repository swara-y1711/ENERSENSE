"""
train_forecast_model.py
-----------------------
ENERSENSE Demand Forecasting Model Training Script (Stage 3).

Trains a lightweight XGBoost Regressor to predict building electricity demand (kW)
using historical I-BLEND telemetry + historical Open-Meteo weather + calendar features.

Key Principles:
  1. Chronological Split:
     Uses the first 80% of October 2016 for training and the remaining 20% for testing.
     No random shuffling is performed to preserve temporal sequence.
  2. No Target Leakage:
     Lag features (15m, 30m, 60m, 1d) only shift backwards into the past.
     Target demand is strictly excluded from input features.
  3. Real Provenance:
     All demand values come from data/processed/academic_demo_15min.csv.
     All weather values come from Open-Meteo's historical archive.
     No fake metrics or hardcoded predictions are used.
  4. Baseline Comparison:
     Evaluates XGBoost against a 15-minute persistence baseline (previous reading).
  5. Artifact Serialization:
     Saves trained model and metadata to backend/model_artifacts/.
"""

import json
from pathlib import Path
import sys
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
import xgboost as xgb

# Paths
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.services.weather_service import weather_service

DATA_PATH = BASE_DIR.parent / "data" / "processed" / "academic_demo_15min.csv"
ARTIFACTS_DIR = BASE_DIR / "model_artifacts"
MODEL_PATH = ARTIFACTS_DIR / "xgboost_demand_model.joblib"
METADATA_PATH = ARTIFACTS_DIR / "model_metadata.json"

FEATURE_COLUMNS = [
    "demand_lag_15m",
    "demand_lag_30m",
    "demand_lag_60m",
    "demand_lag_1d",
    "temperature_c",
    "relative_humidity_percent",
    "rainfall_mm",
    "hour",
    "minute",
    "day_of_week",
    "is_weekend",
    "day_of_month",
]


def prepare_october_dataset(csv_path: Path) -> pd.DataFrame:
    """
    Loads continuous telemetry, computes lag features chronologically,
    attaches real historical Open-Meteo weather, and filters for October 2016.
    """
    print(f"Loading telemetry from: {csv_path}")
    df = pd.read_csv(csv_path)
    df["dt"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("dt").reset_index(drop=True)

    # 1. Past lag features (strictly backward shifts, no future leakage)
    df["demand_lag_15m"] = df["demand_kw"].shift(1)
    df["demand_lag_30m"] = df["demand_kw"].shift(2)
    df["demand_lag_60m"] = df["demand_kw"].shift(4)
    df["demand_lag_1d"] = df["demand_kw"].shift(96)  # 96 * 15m = 24h

    # 2. Calendar / cyclical time features
    df["hour"] = df["dt"].dt.hour
    df["minute"] = df["dt"].dt.minute
    df["day_of_week"] = df["dt"].dt.dayofweek
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["day_of_month"] = df["dt"].dt.day

    # 3. Filter strictly for October 2016 backtest period
    oct_df = df[(df["dt"] >= "2016-10-01") & (df["dt"] < "2016-11-01")].copy().reset_index(drop=True)

    # 4. Attach real historical Open-Meteo weather
    print("Fetching and attaching real historical Open-Meteo weather observations...")
    weather_service.preload_october_2016()

    temps, hums, rains = [], [], []
    for ts in oct_df["timestamp"]:
        w = weather_service.get_weather_for_timestamp(ts)
        temps.append(w.weather.temperature_c)
        hums.append(w.weather.relative_humidity_percent)
        rains.append(w.weather.rainfall_mm)

    oct_df["temperature_c"] = temps
    oct_df["relative_humidity_percent"] = hums
    oct_df["rainfall_mm"] = rains

    return oct_df


def train_and_evaluate():
    """Trains the XGBoost regressor, evaluates metrics, and saves model artifacts."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

    oct_df = prepare_october_dataset(DATA_PATH)
    total_records = len(oct_df)
    print(f"Total October records prepared: {total_records}")

    # Chronological 80/20 train/test split
    train_size = int(total_records * 0.8)
    train_df = oct_df.iloc[:train_size].copy()
    test_df = oct_df.iloc[train_size:].copy()

    train_start, train_end = train_df["timestamp"].iloc[0], train_df["timestamp"].iloc[-1]
    test_start, test_end = test_df["timestamp"].iloc[0], test_df["timestamp"].iloc[-1]

    print("\n--- Split Details ---")
    print(f"Training set: {train_start} to {train_end} ({len(train_df)} records, 80%)")
    print(f"Test set:     {test_start} to {test_end} ({len(test_df)} records, 20%)")

    X_train = train_df[FEATURE_COLUMNS]
    y_train = train_df["demand_kw"]
    X_test = test_df[FEATURE_COLUMNS]
    y_test = test_df["demand_kw"]

    # Train XGBoost regressor
    print("\nTraining XGBoost Regressor...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=2,
    )
    model.fit(X_train, y_train)

    # Predictions
    y_pred = model.predict(X_test)

    # Metrics
    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(root_mean_squared_error(y_test, y_pred))
    r2 = float(r2_score(y_test, y_pred))

    # Persistence baseline (prediction = previous 15m demand)
    baseline_pred = test_df["demand_lag_15m"]
    base_mae = float(mean_absolute_error(y_test, baseline_pred))
    base_rmse = float(root_mean_squared_error(y_test, baseline_pred))
    base_r2 = float(r2_score(y_test, baseline_pred))

    print("\n==========================================")
    print("MODEL EVALUATION RESULTS (OCTOBER 2016)")
    print("==========================================")
    print(f"XGBoost MAE:       {mae:.4f} kW")
    print(f"XGBoost RMSE:      {rmse:.4f} kW")
    print(f"XGBoost R2:        {r2:.4f}")
    print("------------------------------------------")
    print(f"Baseline MAE:      {base_mae:.4f} kW")
    print(f"Baseline RMSE:     {base_rmse:.4f} kW")
    print(f"Baseline R2:       {base_r2:.4f}")
    print("==========================================")

    # Serialize artifacts
    print(f"\nSaving model to: {MODEL_PATH}")
    joblib.dump(model, MODEL_PATH)

    metadata = {
        "model_name": "XGBoost Regressor",
        "algorithm": "xgboost.XGBRegressor",
        "mode": "historical_backtest",
        "feature_count": len(FEATURE_COLUMNS),
        "features": FEATURE_COLUMNS,
        "training_period": {
            "start": train_start,
            "end": train_end,
            "records": len(train_df),
        },
        "test_period": {
            "start": test_start,
            "end": test_end,
            "records": len(test_df),
        },
        "metrics": {
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
        },
        "baseline_metrics": {
            "mae": round(base_mae, 4),
            "rmse": round(base_rmse, 4),
            "r2": round(base_r2, 4),
        },
        "parameters": {
            "n_estimators": 100,
            "max_depth": 5,
            "learning_rate": 0.1,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
        },
        "source": "I-BLEND Academic Building Telemetry + Open-Meteo Historical Weather",
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved metadata to: {METADATA_PATH}")
    print("\nTraining completed successfully!")


if __name__ == "__main__":
    train_and_evaluate()
