# ENERSENSE — Stage 4 Peak Detection & Flexible Demand

## 1. Overview & Operational Principles

Stage 4 introduces empirical peak demand detection and flexible demand estimation atop the Stage 3 XGBoost forecasting model.

> **Operational Notice:**
> ENERSENSE estimates potential flexibility from historical demand patterns. It does not claim that this load is guaranteed to be controllable without building-level equipment and operational data.
>
> All Stage 4 results operate on the historical October 2016 replay/backtest environment.

---

## 2. Empirical Peak Thresholds

Rather than guessing arbitrary wattage limits, peak thresholds are calculated directly from the distribution of all 2,976 15-minute readings in the real October 2016 I-BLEND dataset:

* **90th Percentile (Near-Peak Threshold):** `56.1953 kW`
* **95th Percentile (Peak Threshold):** `64.5560 kW`

### Classification Logic:
* **`below_peak`**: Forecasted demand $< 56.1953\text{ kW}$ (under 90th percentile).
* **`near_peak`**: Forecasted demand $\ge 56.1953\text{ kW}$ and $< 64.5560\text{ kW}$ (between 90th and 95th percentiles).
* **`predicted_peak`**: Forecasted demand $\ge 64.5560\text{ kW}$ (exceeds 95th percentile).

---

## 3. Expected Peak Window Analysis

The `/api/peak/expected` endpoint evaluates the upcoming 2-hour replay trajectory (8 consecutive 15-minute intervals):
1. Runs single-step predictions across the window.
2. Identifies the maximum forecasted demand ($\text{kW}$) and its specific timestamp.
3. Flags `is_peak_expected = true` if the trajectory breaches the peak threshold.

---

## 4. Flexible Demand Estimation

Potential flexible demand estimates how much load can theoretically be shed or shifted without compromising core operations:

$$\text{potential\_flexible\_kw} = \max(\text{predicted\_demand\_kw} - \text{historical\_reference\_demand\_kw}, 0.0)$$

### Historical Reference Baseline:
* Uses the **median demand** of comparable time slots (`is_weekend`, `hour`, `minute`) across the first 80% of October 2016 (training split).
* Computing references from past training slices ensures zero target leakage from future test intervals.
* When demand is near or below typical baseline levels, potential flexibility naturally resolves to $0.0\text{ kW}$ (never negative).

---

## 5. Grid Event What-If Simulator

The `/api/flexibility/simulate` endpoint models a hypothetical demand response event (e.g. reduce 20 kW between 18:00 and 20:00):

1. **Step-by-step resolution:**
   $$\text{applied\_reduction\_kw} = \min(\text{requested\_reduction\_kw}, \text{potential\_flexible\_kw})$$
   $$\text{simulated\_demand\_kw} = \max(0.0, \text{predicted\_demand\_kw} - \text{applied\_reduction\_kw})$$
2. **Feasibility Assessment:**
   * Flags `is_reduction_achieved = true` for each interval where `applied_reduction_kw >= requested_reduction_kw`.
   * Flags `is_fully_achievable = true` only if all intervals throughout the event satisfy the requested reduction.
3. **Simulation Boundary:**
   * This is strictly a decision-support what-if simulation. ENERSENSE does not send control commands to building equipment (HVAC, chillers, pumps, lighting, or EV chargers).

---

## 6. API Endpoints

- `GET /api/peak/current`: Current timestamp peak classification and threshold distance.
- `GET /api/peak/expected`: Upcoming 2-hour peak expectation trajectory.
- `GET /api/flexibility/current`: Potential flexibility estimate compared to historical slot median baseline.
- `POST /api/flexibility/simulate`: What-if grid event reduction simulation.
