# ENERSENSE — Stage 6 Impact & Baseline Verification

## 1. Purpose

Stage 6 provides an **honest impact-verification layer** for ENERSENSE. It compares actual historical building power demand against an explainable baseline and estimates what-if scenario impacts.

Flow:

**Actual historical demand → Baseline / reference demand → ENERSENSE scenario → Difference → kW / kWh impact metrics**

This stage does **not** claim that ENERSENSE actually saved energy in the historical I-BLEND dataset. Because all data comes from historical replay, results represent **simulated scenario what-if estimations**, not live physical interventions.

---

## 2. Actual vs. Baseline vs. Scenario Methodology

### A. Actual Demand
The real 15-minute power demand (kW) replayed from the I-BLEND dataset for the Academic Building (October 2016).

### B. Baseline / Reference Demand
Uses the Stage 4 historical slot median baseline. For any 15-minute interval, the reference demand is the median demand of matching historical slots (`is_weekend`, `hour`, `minute`) from the 80% training partition of the October 2016 dataset.

### C. ENERSENSE Simulated Scenario
A hypothetical scenario where a demand reduction (e.g., 20 kW during a peak event) is requested:
1. **Flexibility Cap**: Applied reduction is strictly bounded by the estimated potential flexibility:
   $$\text{applied\_simulated\_reduction\_kw} = \min(\max(0, \text{requested\_reduction\_kw}), \text{potential\_flexible\_kw})$$
2. **Non-Negative Bounding**: Scenario demand cannot fall below zero:
   $$\text{scenario\_demand\_kw} = \max(0, \text{actual\_demand\_kw} - \text{applied\_simulated\_reduction\_kw})$$
3. **No Unbounded Claims**: If estimated potential flexibility is 0 kW, applied reduction is 0 kW. If 15 kW is available and 20 kW is requested, exactly 15 kW is applied.

---

## 3. Power (kW) vs. Energy (kWh) Calculation

Demand in kW represents instantaneous power over a 15-minute interval. Energy in kWh is power integrated over time:

$$\text{interval\_duration\_hours} = 0.25 \text{ hours}$$

$$\text{interval\_energy\_impact\_kwh} = \text{applied\_simulated\_reduction\_kw} \times 0.25$$

### Concrete Validation Example
- **Requested Reduction**: 20.0 kW
- **Potential Flexibility**: 15.0 kW
- **15-Minute Interval**: 0.25 hours
- **Applied Simulated Reduction**: 15.0 kW
- **Energy Impact**: $15.0 \text{ kW} \times 0.25 \text{ h} = 3.75 \text{ kWh}$ (never reported as 15 kWh)

---

## 4. Multi-Interval What-If Scenario Aggregation

The `POST /api/impact/simulate` endpoint aggregates interval metrics across a historical window $[T_{\text{start}}, T_{\text{end}}]$:

- **Total Intervals**: Count of 15-minute intervals in window.
- **Fully Achievable Intervals**: Count of intervals where $\text{potential\_flexible\_kw} \ge \text{requested\_reduction\_kw}$.
- **Achievable Percentage**: $\frac{\text{fully\_achievable\_intervals}}{\text{total\_intervals}} \times 100\%$.
- **Total Simulated Reduction (kWh)**: $\sum (\text{applied\_simulated\_reduction\_kw}_i \times 0.25)$.
- **Average & Maximum Simulated Reduction (kW)**: Average and peak applied reductions.

---

## 5. Why Simulation Rather Than Measured Savings

- **Historical Dataset**: I-BLEND telemetry is fixed historical data. No physical intervention was performed on the building in October 2016.
- **No Equipment Control**: ENERSENSE does not send control commands to HVAC, pumps, lighting, or EV chargers in this MVP.
- **Honest Labeling**: Results use terms like *simulated reduction*, *estimated impact*, *scenario*, and *what-if*. Claims like "ENERSENSE saved X%" or "actual savings were X%" are explicitly prohibited.

---

## 6. No Monetary Savings Claims

Because the October 2016 demo tariff does not specify a validated base $\text{INR}/\text{kWh}$ energy rate (`base_energy_rate = None`), Stage 6 reports energy impacts strictly in **kW** and **kWh**. It does not calculate rupee savings or financial returns.

---

## 7. Path to Live Deployment Impact Verification

In a future live deployment, Stage 6 will transition from backtest simulation to measured impact using standard measurement and verification (M&V) protocols (e.g., IPMVP Option C):
1. **Live Baseline**: Model baseline demand using live weather and calendar regression.
2. **Controlled Intervention**: Log actual control advisory responses or automated setpoint changes.
3. **Measured Impact**: Calculate $\text{Measured Impact} = \text{Baseline Demand} - \text{Actual Metered Demand}$ during intervention windows.

---

## 8. API Endpoints

- `GET /api/impact/current?timestamp=...&requested_reduction_kw=...`
  - Returns actual vs. baseline vs. scenario metrics for a single timestamp.
- `POST /api/impact/simulate`
  - Request body: `{ "start_timestamp": "...", "end_timestamp": "...", "requested_reduction_kw": 20.0 }`
  - Returns aggregate multi-interval what-if impact analysis.
