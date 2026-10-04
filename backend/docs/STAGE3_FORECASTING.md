# ENERSENSE — Stage 3 Demand Forecasting

## Architecture Overview

ENERSENSE uses historical Indian building electricity data from I-BLEND together with historical weather context to train a demand forecasting model. For the prototype, October 2016 is replayed as a historical backtest period. The same forecasting pipeline can later consume live smart-meter telemetry.

> **Operational Notice:**
> This forecast is a historical backtest/demo forecast, not a live operational prediction.

---

## Model Pipeline

1. **Telemetry Source:**
   * 15-minute electrical power telemetry (`demand_kw`) from the I-BLEND dataset (`Academic Building`, 2016).
2. **Weather Context:**
   * Hourly air temperature, relative humidity, and rainfall from Open-Meteo's historical archive for Delhi (`28.6139° N, 77.2090° E`).
3. **Feature Engineering (12 Features):**
   * Past demand lags: `demand_lag_15m`, `demand_lag_30m`, `demand_lag_60m`, `demand_lag_1d` (strictly backward-shifted to prevent lookahead/target leakage).
   * Weather metrics: `temperature_c`, `relative_humidity_percent`, `rainfall_mm`.
   * Temporal calendar: `hour`, `minute`, `day_of_week`, `is_weekend`, `day_of_month`.
4. **Chronological Evaluation Split:**
   * **Training Period:** `2016-10-01T00:00:00+05:30` to `2016-10-25T18:45:00+05:30` (2,380 records, 80%)
   * **Test Period:** `2016-10-25T19:00:00+05:30` to `2016-10-31T23:45:00+05:30` (596 records, 20%)
   * Time series order is strictly maintained (no random shuffling).

---

## Verified Evaluation Results (Test Set)

| Metric | XGBoost Regressor | Persistence Baseline |
| :--- | :--- | :--- |
| **MAE** | **1.2449 kW** | 1.0186 kW |
| **RMSE** | **1.8066 kW** | 1.9714 kW |
| **R²** | **0.9805** | 0.9768 |

*XGBoost achieves a lower RMSE and higher $R^2$ variance explained across dynamic load transitions and peak ramping conditions.*

---

## API Endpoints

- `GET /api/forecast/current`: Returns real actual demand, predicted demand, prediction error, and weather context for the active replay timestamp (or optional `?timestamp=...`).
- `GET /api/forecast/status`: Returns model metadata, feature vector details, and verified test set evaluation metrics.
