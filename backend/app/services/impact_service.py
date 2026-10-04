"""
impact_service.py
-----------------
ENERSENSE Impact Verification & Baseline Comparison Service (Stage 6).

Compares actual historical I-BLEND building demand against an explainable baseline
(historical slot median) and estimates what-if scenario impacts without claiming
measured historical savings or executing physical equipment control.

Core Principles:
  1. Actual vs. Baseline vs. Scenario:
     - Actual demand: real I-BLEND replayed telemetry.
     - Baseline demand: historical slot median from Stage 4.
     - Scenario demand: simulated demand after applying potential flexibility reduction.
  2. Bounded & Capped Reduction:
     - applied_simulated_reduction_kw = min(max(0.0, requested_reduction_kw), potential_flexible_kw)
     - scenario_demand_kw = max(0.0, actual_demand_kw - applied_simulated_reduction_kw)
  3. Accurate Energy Calculations:
     - 15-minute interval = 0.25 hours.
     - energy_impact_kwh = applied_simulated_reduction_kw * 0.25.
  4. Advisory & Simulation Only:
     - No monetary savings claims (no ₹ / INR cost figures).
     - No automated control actions.
"""

from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from app.services.flexibility_service import flexibility_service
from app.services.forecast_service import forecast_service
from app.services.replay_service import replay_service

MODE = "historical_backtest"
METHOD = "slot_median_baseline_what_if"
INTERVAL_DURATION_HOURS = 0.25

ADVISORY_NOTICE = (
    "Simulated scenario impact only. ENERSENSE estimates potential load flexibility "
    "based on historical reference medians. This is a what-if scenario simulation and "
    "does not claim measured historical reductions or automatic equipment control. "
    "No monetary calculations are provided."
)


class CurrentImpactResult(BaseModel):
    """Result payload for single-interval impact verification and baseline comparison."""

    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    actual_demand_kw: float = Field(..., description="Actual replayed building demand in kW")
    baseline_demand_kw: float = Field(..., description="Historical slot median baseline in kW")
    predicted_demand_kw: float = Field(..., description="XGBoost predicted demand in kW")
    scenario_demand_kw: float = Field(..., description="Simulated demand under requested scenario in kW")
    potential_reduction_kw: float = Field(..., description="Estimated potential flexible demand in kW")
    potential_flexible_kw: float = Field(..., description="Alias for potential_reduction_kw in kW")
    requested_reduction_kw: float = Field(..., description="Requested reduction in kW")
    applied_simulated_reduction_kw: float = Field(..., description="Applied simulated reduction capped by potential flexibility (kW)")
    baseline_difference_kw: float = Field(..., description="Actual demand minus baseline demand (kW)")
    scenario_difference_from_actual_kw: float = Field(..., description="Scenario demand minus actual demand (kW)")
    interval_duration_hours: float = Field(INTERVAL_DURATION_HOURS, description="Interval duration in hours (0.25 for 15m)")
    estimated_energy_impact_kwh: float = Field(..., description="Simulated energy impact in kWh for the 15m interval")
    baseline_method: str = Field("historical_slot_median", description="Baseline estimation methodology")
    method: str = Field(METHOD, description="Impact calculation methodology")
    mode: str = Field(MODE, description="Operation mode")
    notice: str = Field(ADVISORY_NOTICE, description="Disclaimer notice")


class ImpactSimulationRequest(BaseModel):
    """Input schema for multi-interval what-if scenario simulation."""

    start_timestamp: str = Field(..., description="Start timestamp of scenario window (ISO 8601)")
    end_timestamp: str = Field(..., description="End timestamp of scenario window (ISO 8601)")
    requested_reduction_kw: float = Field(..., description="Hypothetical requested demand reduction in kW")


class ImpactIntervalResult(BaseModel):
    """Per-interval detail within a scenario simulation."""

    timestamp: str
    actual_demand_kw: float
    baseline_demand_kw: float
    predicted_demand_kw: float
    potential_flexible_kw: float
    requested_reduction_kw: float
    applied_simulated_reduction_kw: float
    scenario_demand_kw: float
    interval_energy_impact_kwh: float
    is_fully_achievable: bool


class ImpactSimulationResponse(BaseModel):
    """Aggregated summary of multi-interval impact simulation."""

    start_timestamp: str
    end_timestamp: str
    requested_reduction_kw: float
    interval_count: int
    total_intervals: int
    fully_achievable_intervals: int
    achievable_percentage: float
    average_actual_demand_kw: float
    average_baseline_demand_kw: float
    average_scenario_demand_kw: float
    average_simulated_reduction_kw: float
    maximum_simulated_reduction_kw: float
    total_simulated_reduction_kwh: float
    interval_duration_hours: float = INTERVAL_DURATION_HOURS
    mode: str = MODE
    notice: str = ADVISORY_NOTICE
    intervals: List[ImpactIntervalResult] = Field(default_factory=list)


class ImpactVerificationService:
    """Service implementing explainable impact verification and what-if simulation."""

    def get_current_impact(
        self,
        timestamp: Optional[str] = None,
        requested_reduction_kw: float = 0.0,
    ) -> CurrentImpactResult:
        """
        Calculates actual vs. baseline vs. simulated scenario for a single timestamp.
        """
        if timestamp:
            record = replay_service.get_record_by_timestamp(timestamp)
            if not record:
                raise ValueError(f"No historical record found for timestamp '{timestamp}'.")
        else:
            record = replay_service.get_current_record()

        ts = record.timestamp
        actual_kw = round(float(record.demand_kw), 4)

        flex_res = flexibility_service.estimate_flexibility(timestamp=ts)
        baseline_kw = round(float(flex_res.historical_reference_demand_kw), 4)
        pred_kw = round(float(flex_res.predicted_demand_kw), 4)
        pot_flex_kw = round(float(flex_res.potential_flexible_kw), 4)

        req_kw = max(0.0, float(requested_reduction_kw))
        applied_kw = round(min(req_kw, pot_flex_kw), 4)
        scenario_kw = round(max(0.0, actual_kw - applied_kw), 4)

        baseline_diff_kw = round(actual_kw - baseline_kw, 4)
        scenario_diff_kw = round(scenario_kw - actual_kw, 4)
        energy_impact_kwh = round(applied_kw * INTERVAL_DURATION_HOURS, 4)

        return CurrentImpactResult(
            timestamp=ts,
            actual_demand_kw=actual_kw,
            baseline_demand_kw=baseline_kw,
            predicted_demand_kw=pred_kw,
            scenario_demand_kw=scenario_kw,
            potential_reduction_kw=pot_flex_kw,
            potential_flexible_kw=pot_flex_kw,
            requested_reduction_kw=req_kw,
            applied_simulated_reduction_kw=applied_kw,
            baseline_difference_kw=baseline_diff_kw,
            scenario_difference_from_actual_kw=scenario_diff_kw,
            interval_duration_hours=INTERVAL_DURATION_HOURS,
            estimated_energy_impact_kwh=energy_impact_kwh,
            baseline_method="historical_slot_median",
            method=METHOD,
            mode=MODE,
            notice=ADVISORY_NOTICE,
        )

    def simulate_impact_scenario(
        self,
        request: ImpactSimulationRequest,
    ) -> ImpactSimulationResponse:
        """
        Simulates multi-interval what-if scenario over [start_timestamp, end_timestamp].
        """
        all_recs = replay_service._records
        start_dt = pd.to_datetime(request.start_timestamp.strip().replace("Z", "+00:00"))
        end_dt = pd.to_datetime(request.end_timestamp.strip().replace("Z", "+00:00"))

        in_window_recs = [
            r for r in all_recs
            if start_dt <= pd.to_datetime(r.timestamp) <= end_dt
        ]

        if not in_window_recs:
            raise ValueError(
                f"No replay records found between '{request.start_timestamp}' and '{request.end_timestamp}'."
            )

        req_kw = max(0.0, float(request.requested_reduction_kw))
        interval_results: List[ImpactIntervalResult] = []

        actual_demands: List[float] = []
        baseline_demands: List[float] = []
        scenario_demands: List[float] = []
        applied_reductions: List[float] = []
        achievable_count = 0

        for rec in in_window_recs:
            ts = rec.timestamp
            actual_kw = round(float(rec.demand_kw), 4)

            flex_res = flexibility_service.estimate_flexibility(timestamp=ts)
            baseline_kw = round(float(flex_res.historical_reference_demand_kw), 4)
            pred_kw = round(float(flex_res.predicted_demand_kw), 4)
            pot_flex_kw = round(float(flex_res.potential_flexible_kw), 4)

            applied_kw = round(min(req_kw, pot_flex_kw), 4)
            scenario_kw = round(max(0.0, actual_kw - applied_kw), 4)
            interval_kwh = round(applied_kw * INTERVAL_DURATION_HOURS, 4)

            is_achievable = (pot_flex_kw >= req_kw) if req_kw > 0.0 else True
            if is_achievable:
                achievable_count += 1

            actual_demands.append(actual_kw)
            baseline_demands.append(baseline_kw)
            scenario_demands.append(scenario_kw)
            applied_reductions.append(applied_kw)

            interval_results.append(
                ImpactIntervalResult(
                    timestamp=ts,
                    actual_demand_kw=actual_kw,
                    baseline_demand_kw=baseline_kw,
                    predicted_demand_kw=pred_kw,
                    potential_flexible_kw=pot_flex_kw,
                    requested_reduction_kw=req_kw,
                    applied_simulated_reduction_kw=applied_kw,
                    scenario_demand_kw=scenario_kw,
                    interval_energy_impact_kwh=interval_kwh,
                    is_fully_achievable=is_achievable,
                )
            )

        total_int = len(interval_results)
        achievable_pct = round((achievable_count / total_int) * 100.0, 2) if total_int > 0 else 0.0

        avg_actual = round(float(np.mean(actual_demands)), 4) if actual_demands else 0.0
        avg_baseline = round(float(np.mean(baseline_demands)), 4) if baseline_demands else 0.0
        avg_scenario = round(float(np.mean(scenario_demands)), 4) if scenario_demands else 0.0
        avg_applied = round(float(np.mean(applied_reductions)), 4) if applied_reductions else 0.0
        max_applied = round(float(np.max(applied_reductions)), 4) if applied_reductions else 0.0

        total_kwh = round(sum(r.interval_energy_impact_kwh for r in interval_results), 4)

        return ImpactSimulationResponse(
            start_timestamp=in_window_recs[0].timestamp,
            end_timestamp=in_window_recs[-1].timestamp,
            requested_reduction_kw=req_kw,
            interval_count=total_int,
            total_intervals=total_int,
            fully_achievable_intervals=achievable_count,
            achievable_percentage=achievable_pct,
            average_actual_demand_kw=avg_actual,
            average_baseline_demand_kw=avg_baseline,
            average_scenario_demand_kw=avg_scenario,
            average_simulated_reduction_kw=avg_applied,
            maximum_simulated_reduction_kw=max_applied,
            total_simulated_reduction_kwh=total_kwh,
            interval_duration_hours=INTERVAL_DURATION_HOURS,
            mode=MODE,
            notice=ADVISORY_NOTICE,
            intervals=interval_results,
        )


impact_service = ImpactVerificationService()
