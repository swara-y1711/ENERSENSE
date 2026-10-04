"""
flexibility_service.py
----------------------
ENERSENSE Flexible Demand Estimation & Grid Event Simulator (Stage 4).

Estimates potential flexible electrical demand (kW) from historical time-slot patterns
and provides a what-if grid event simulation without executing physical equipment control.

Core Principles:
  1. No Guaranteed Control Claims:
     Flexibility is an estimate of load that exceeds comparable historical baseline
     levels, labeled as 'estimated_potential_flexible_demand', NOT guaranteed controllable load.
  2. Leakage Prevention:
     Reference baselines are calculated strictly using the median demand of comparable
     slots (is_weekend, hour, minute) from historical training data.
  3. Non-Negative Bounding:
     potential_flexible_kw = max(predicted_demand_kw - historical_reference_demand_kw, 0.0)
     applied_reduction_kw = min(requested_reduction_kw, potential_flexible_kw)
     simulated_demand_kw = max(0.0, predicted_demand_kw - applied_reduction_kw)
  4. Scenario Simulation Only:
     The grid event endpoint is a hypothetical decision-support tool. It does not
     dispatch commands to BMS, HVAC, pumps, or EV chargers.
"""

from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from app.services.forecast_service import forecast_service
from app.services.replay_service import replay_service

BASE_DIR = Path(__file__).resolve().parents[2]


class FlexibilityResult(BaseModel):
    """Result schema for single-point flexibility estimation."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    predicted_demand_kw: float = Field(..., description="Forecasted demand in kW from XGBoost")
    historical_reference_demand_kw: float = Field(..., description="Median demand for comparable time slot (kW)")
    potential_flexible_kw: float = Field(..., description="Estimated potential flexible demand in kW")
    flexibility_method: str = Field(
        "historical_slot_median_differential",
        description="Estimation methodology",
    )
    mode: str = Field("historical_backtest", description="Replay backtest mode")
    notice: str = Field(
        "Estimated potential flexible demand based on historical patterns. "
        "Not guaranteed controllable load.",
        description="Disclaimer",
    )


class GridEventSimulationRequest(BaseModel):
    """Input payload for grid event what-if simulation."""
    start_time: str = Field(..., description="Start timestamp of grid event in October 2016 (ISO 8601)")
    end_time: str = Field(..., description="End timestamp of grid event in October 2016 (ISO 8601)")
    requested_reduction_kw: float = Field(..., gt=0, description="Hypothetical requested demand reduction in kW")


class GridEventIntervalResult(BaseModel):
    """Interval-by-interval simulation results during a grid event."""
    timestamp: str
    predicted_demand_kw: float
    historical_reference_demand_kw: float
    potential_flexible_kw: float
    requested_reduction_kw: float
    applied_reduction_kw: float
    simulated_demand_kw: float
    is_reduction_achieved: bool


class GridEventSimulationResponse(BaseModel):
    """Summary output of grid event scenario simulation."""
    start_time: str
    end_time: str
    requested_reduction_kw: float
    total_intervals: int
    achievable_intervals_count: int
    is_fully_achievable: bool
    average_potential_flexible_kw: float
    max_potential_flexible_kw: float
    average_simulated_demand_kw: float
    mode: str = "historical_what_if_simulation"
    notice: str = (
        "Hypothetical scenario simulation only. ENERSENSE does not send "
        "commands to or control building equipment (HVAC, pumps, EV chargers, lighting)."
    )
    intervals: List[GridEventIntervalResult]


class FlexibilityEstimationService:
    """
    Manages historical slot baseline reference computation and grid event simulation.
    """

    def __init__(self):
        # Key: (is_weekend: int, hour: int, minute: int) -> median demand in kW
        self._reference_table: Dict[Tuple[int, int, int], float] = {}
        self._fallback_median_kw: float = 24.74
        self._initialize_reference_table()

    def _initialize_reference_table(self):
        """
        Computes historical reference baseline (median demand per slot)
        using the first 80% of October 2016 to prevent test set lookahead leakage.
        """
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
        oct_df = df[(df["dt"] >= "2016-10-01") & (df["dt"] < "2016-11-01")].copy().reset_index(drop=True)

        # Use training slice (first 80%) to calculate historical median references without leakage
        train_df = oct_df.iloc[: int(len(oct_df) * 0.8)].copy()
        train_df["hour"] = train_df["dt"].dt.hour
        train_df["minute"] = train_df["dt"].dt.minute
        train_df["day_of_week"] = train_df["dt"].dt.dayofweek
        train_df["is_weekend"] = (train_df["day_of_week"] >= 5).astype(int)

        self._fallback_median_kw = round(float(train_df["demand_kw"].median()), 4)

        grouped = train_df.groupby(["is_weekend", "hour", "minute"])["demand_kw"].median()
        table = {}
        for (is_wk, hr, mn), med in grouped.items():
            table[(int(is_wk), int(hr), int(mn))] = round(float(med), 4)

        self._reference_table = table

    def get_reference_demand(self, is_weekend: int, hour: int, minute: int) -> float:
        """Looks up the median historical baseline for the specified time slot."""
        return self._reference_table.get((is_weekend, hour, minute), self._fallback_median_kw)

    def estimate_flexibility(self, timestamp: Optional[str] = None) -> FlexibilityResult:
        """
        Estimates potential flexible demand (kW) for the given timestamp (or current replay cursor).
        """
        forecast = forecast_service.predict_demand(timestamp=timestamp)
        dt = pd.to_datetime(forecast.timestamp)
        is_wk = 1 if dt.dayofweek >= 5 else 0

        ref_kw = self.get_reference_demand(is_wk, dt.hour, dt.minute)
        pot_flex_kw = max(round(forecast.predicted_demand_kw - ref_kw, 4), 0.0)

        return FlexibilityResult(
            timestamp=forecast.timestamp,
            predicted_demand_kw=forecast.predicted_demand_kw,
            historical_reference_demand_kw=ref_kw,
            potential_flexible_kw=pot_flex_kw,
            flexibility_method="historical_slot_median_differential",
            mode="historical_backtest",
        )

    def simulate_grid_event(self, request: GridEventSimulationRequest) -> GridEventSimulationResponse:
        """
        Executes a what-if scenario simulation over the requested time window [start_time, end_time].
        """
        # Find all October records that fall within [start_time, end_time]
        all_recs = replay_service._records
        clean_start = request.start_time.strip().replace("Z", "+00:00")
        clean_end = request.end_time.strip().replace("Z", "+00:00")

        in_window_recs = [
            r for r in all_recs
            if clean_start <= r.timestamp <= clean_end
        ]

        if not in_window_recs:
            raise ValueError(
                f"No October 2016 records found between '{request.start_time}' and '{request.end_time}'."
            )

        interval_results: List[GridEventIntervalResult] = []
        flexible_values: List[float] = []
        simulated_demands: List[float] = []
        achievable_count = 0

        for rec in in_window_recs:
            flex_res = self.estimate_flexibility(rec.timestamp)
            pot_flex = flex_res.potential_flexible_kw
            flexible_values.append(pot_flex)

            # Applied reduction is capped by potential flexibility
            applied_red = round(min(request.requested_reduction_kw, pot_flex), 4)
            sim_demand = round(max(0.0, flex_res.predicted_demand_kw - applied_red), 4)
            simulated_demands.append(sim_demand)

            achieved = (applied_red >= request.requested_reduction_kw)
            if achieved:
                achievable_count += 1

            interval_results.append(
                GridEventIntervalResult(
                    timestamp=rec.timestamp,
                    predicted_demand_kw=flex_res.predicted_demand_kw,
                    historical_reference_demand_kw=flex_res.historical_reference_demand_kw,
                    potential_flexible_kw=pot_flex,
                    requested_reduction_kw=request.requested_reduction_kw,
                    applied_reduction_kw=applied_red,
                    simulated_demand_kw=sim_demand,
                    is_reduction_achieved=achieved,
                )
            )

        total_int = len(interval_results)
        is_fully_achieved = (achievable_count == total_int)

        avg_flex = round(float(np.mean(flexible_values)), 4) if flexible_values else 0.0
        max_flex = round(float(np.max(flexible_values)), 4) if flexible_values else 0.0
        avg_sim = round(float(np.mean(simulated_demands)), 4) if simulated_demands else 0.0

        return GridEventSimulationResponse(
            start_time=in_window_recs[0].timestamp,
            end_time=in_window_recs[-1].timestamp,
            requested_reduction_kw=request.requested_reduction_kw,
            total_intervals=total_int,
            achievable_intervals_count=achievable_count,
            is_fully_achievable=is_fully_achieved,
            average_potential_flexible_kw=avg_flex,
            max_potential_flexible_kw=max_flex,
            average_simulated_demand_kw=avg_sim,
            mode="historical_what_if_simulation",
            intervals=interval_results,
        )


# Singleton instance
flexibility_service = FlexibilityEstimationService()
