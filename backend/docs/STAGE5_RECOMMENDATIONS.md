# ENERSENSE — Stage 5 Actionable Recommendations

## 1. Purpose

Stage 5 turns existing ENERSENSE intelligence into **simple, explainable, advisory recommendations** for occupants and facility managers.

Flow:

**Forecast → Peak detection → Potential flexibility → Tariff / time / season context → Recommendation**

This stage does **not** control equipment, detect occupancy, or calculate monetary savings.

> **Operational notice:** Recommendations are advisory. ENERSENSE does not send commands to HVAC, pumps, lighting, or EV chargers, and does not claim that estimated potential flexible demand is actually controllable.

All Stage 5 results run in **historical_backtest / replay** mode on October 2016 I-BLEND + Open-Meteo context.

---

## 2. Inputs (reused, not duplicated)

The engine calls existing Stage 1–4 services:

| Input | Source |
| :--- | :--- |
| Predicted demand (kW) | Stage 3 `forecast_service` via Stage 4 peak detection |
| Peak status (`below_peak` / `near_peak` / `predicted_peak`) | Stage 4 `peak_service` |
| Empirical 90th / 95th percentile thresholds | Stage 4 peak thresholds from October 2016 I-BLEND |
| Potential flexible demand (kW) | Stage 4 `flexibility_service` (historical slot median differential) |
| Upcoming peak window | Stage 4 `peak_service.get_expected_peak` (default 2 hours) |
| Tariff period (`off_peak` / `normal` / `peak`) | Stage 1 `get_tariff_for_timestamp` (October BRPL demo schedule) |
| Weather / season context | Stage 2 Open-Meteo historical weather (Delhi) |
| Weekend / weekday | Calendar from the replay timestamp |

No new ML model is trained for recommendations.

---

## 3. Rule hierarchy

1. **Comfortably below peak** (`below_peak` and no peak in the upcoming 2-hour window): return **no recommendations** (`overall_priority = none`). Do not nag occupants when there is no meaningful peak or flexibility signal.
2. **Predicted peak** (forecast ≥ 95th percentile): **high** priority occupant + facility-manager recommendations. Occupant wording stays simple (“consider shifting / deferring”). Facility-manager wording is operational (“review potential flexible loads”).
3. **Near peak** (forecast ≥ 90th and < 95th percentile): **medium** priority watch-and-defer guidance.
4. **Upcoming peak** in the look-ahead window while the focal interval is still below peak: occupant **medium**, facility manager **high**.
5. **Meaningful potential flexibility** (≥ 3 kW above the historical slot median): mention *potential flexible demand* and *consider shifting*. Never describe it as guaranteed controllable load.
6. **Tariff context**: always attached when a recommendation is emitted (October demo: 00:00–06:00 `off_peak`, otherwise `normal`). No ₹ rates or savings figures.
7. **Weather / season overlay** (when Open-Meteo is available):
   - Hot (≥ 32 °C): consider avoiding additional non-essential cooling load during a predicted/near peak.
   - Warm (≥ 28 °C) on predicted peak: softer occupant cooling-load note.
   - Rainy (≥ 0.5 mm): consider deferring non-critical flexible *activities* — no invented appliance telemetry.
   Season for this demo is **post-monsoon** (October, Delhi).
8. **Weekend overlay**: low-priority facility-manager note that occupancy may differ; still review if a peak is predicted.

Priority levels: `high`, `medium`, `low`, `none`.

Audience: `occupant`, `facility_manager`, `both`.

---

## 4. Example recommendations

**Predicted peak (occupant):**
> Consider shifting flexible loads outside the expected peak window. If EV charging is available, consider charging after the expected peak.

**Predicted peak (facility manager):**
> Facility manager: review potential flexible loads before the predicted peak. Consider deferring non-critical flexible loads until after the peak period.

**Hot weather overlay:**
> Consider avoiding additional non-essential cooling load during the predicted peak.

**Rainy overlay:**
> Consider deferring non-critical flexible activities during rainy conditions around the predicted peak.

**Below peak, no upcoming peak:** empty `recommendations` list.

The engine will **not** emit control orders such as “Turn off HVAC now”, “Switch off pump”, or “Stop EV charger”. Those require equipment control data that this MVP does not have.

---

## 5. API

- `GET /api/recommendations/current?timestamp=...`  
  Recommendations for the current replay timestamp (cursor if omitted).
- `GET /api/recommendations/expected?start_timestamp=...&window_hours=2`  
  Recommendations for the upcoming window, focused on the highest predicted-demand interval.

There are **no POST / control endpoints**.

Each recommendation includes: `recommendation_id`, `priority`, `audience`, `action`, `reason`, `expected_window`, `peak_status`, `predicted_demand_kw`, `potential_flexible_kw`, `tariff_period`, `season`, `weather_context`, `evidence`, `method`, `mode`.

---

## 6. Why advisory rather than automatic control

ENERSENSE is a software intelligence layer. Stage 4 estimates **potential** flexible demand from historical patterns. The building has no BMS command path, occupancy sensors, or confirmed controllable assets in this MVP. Automatic shed/shift would be unsafe and dishonest. Stage 5 therefore **recommends** that people consider shifting or reviewing loads.

---

## 7. Historical backtest / replay mode

All timestamps are October 2016 I-BLEND replay intervals. Forecasts are historical backtests, weather is Open-Meteo archive data for Delhi, and tariff is the configurable October 2016 demo (DERC/BRPL winter-style) schedule. `mode` is always `historical_backtest`.

---

## 8. No monetary savings claims

Base energy rate remains unverified (`null`) in the Stage 1 tariff engine. Recommendations include **tariff period** (`off_peak` / `normal`) for context only. They do not invent ₹/kWh prices, energy cost, or savings.

---

## 9. Limitations

- Generic actions only (no known equipment inventory).
- Potential flexibility is an estimate, not a dispatch quantity.
- Weather is outdoor historical context, not indoor comfort or HVAC state.
- October demo tariff has no evening peak surcharge window.
- Looks ahead using the existing 15-minute replay/forecast grid, not a new model.
- Not live operational control.
