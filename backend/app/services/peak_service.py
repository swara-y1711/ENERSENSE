"""
peak_service.py
---------------
ENERSENSE Peak Demand Detection Service (Stage 4).

Calculates empirical peak demand thresholds from historical October 2016 I-BLEND
telemetry and classifies predicted demand into:
  - 'below_peak': predicted demand < 90th percentile
  - 'near_peak':  predicted demand >= 90th percentile and < 95th percentile
  - 'predicted_peak': predicted demand >= 95th percentile

Also evaluates upcoming 2-hour replay windows to anticipate impending peak events.

Key Principles:
  1. Real Empirical Thresholds:
     Percentiles (90th: 56.1953 kW, 95th: 64.5560 kW) are calculated directly from
     real October 2016 I-BLEND telemetry, not fabricated.
  2. Historical Replay / Backtest:
     Clearly marks all peak evaluations as historical backtest assessments.
"""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from pydantic import BaseModel, Field

from app.services.forecast_service import forecast_service
from app.services.replay_service import replay_service

BASE_DIR = Path(__file__).resolve().parents[2]


class PeakStatusResult(BaseModel):
    """Result schema for peak demand detection at a specific timestamp."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    predicted_demand_kw: float = Field(..., description="Forecasted demand in kW from XGBoost")
    actual_demand_kw: Optional[float] = Field(None, description="Actual historical demand in kW if available")
    peak_threshold_kw: float = Field(..., description="95th percentile historical demand threshold in kW")
    near_peak_threshold_kw: float = Field(..., description="90th percentile historical demand threshold in kW")
    is_predicted_peak: bool = Field(..., description="True if predicted demand >= 95th percentile")
    peak_status: str = Field(..., description="'below_peak', 'near_peak', or 'predicted_peak'")
    mode: str = Field("historical_backtest", description="Replay backtest mode")


class ExpectedPeakWindowResult(BaseModel):
    """Result schema for expected peak analysis across an upcoming window."""
    window_start: str = Field(..., description="Start timestamp of observation window")
    window_end: str = Field(..., description="End timestamp of observation window")
    predicted_peak_demand_kw: float = Field(..., description="Maximum forecasted demand in window (kW)")
    predicted_peak_timestamp: str = Field(..., description="Timestamp where maximum predicted peak occurs")
    peak_threshold_kw: float = Field(..., description="95th percentile peak threshold in kW")
    near_peak_threshold_kw: float = Field(..., description="90th percentile near-peak threshold in kW")
    is_peak_expected: bool = Field(..., description="True if highest predicted demand exceeds 95th percentile")
    window_intervals_count: int = Field(..., description="Number of 15-minute intervals evaluated")
    mode: str = Field("historical_backtest", description="Replay backtest mode")
    intervals: List[Dict[str, Any]] = Field(..., description="Interval-by-interval forecasted trajectory")


class PeakDetectionService:
    """
    Evaluates building telemetry against empirical historical peak thresholds.
    """

    def __init__(self):
        self.near_peak_threshold_kw: float = 0.0
        self.peak_threshold_kw: float = 0.0
        self._calculate_empirical_thresholds()

    def _calculate_empirical_thresholds(self):
        """
        Calculates 90th and 95th percentiles from real October 2016 I-BLEND telemetry.
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
        oct_df = df[(df["timestamp"] >= "2016-10-01") & (df["timestamp"] < "2016-11-01")]

        demands = oct_df["demand_kw"].values
        self.near_peak_threshold_kw = round(float(np.percentile(demands, 90)), 4)
        self.peak_threshold_kw = round(float(np.percentile(demands, 95)), 4)

    def classify_peak_demand(self, demand_kw: float) -> str:
        """Determines peak classification status for a given demand value."""
        if demand_kw >= self.peak_threshold_kw:
            return "predicted_peak"
        elif demand_kw >= self.near_peak_threshold_kw:
            return "near_peak"
        return "below_peak"

    def detect_peak(self, timestamp: Optional[str] = None) -> PeakStatusResult:
        """
        Performs peak detection for a specific timestamp (or active replay cursor).
        """
        forecast = forecast_service.predict_demand(timestamp=timestamp)
        status = self.classify_peak_demand(forecast.predicted_demand_kw)
        is_peak = (status == "predicted_peak")

        return PeakStatusResult(
            timestamp=forecast.timestamp,
            predicted_demand_kw=forecast.predicted_demand_kw,
            actual_demand_kw=forecast.actual_demand_kw,
            peak_threshold_kw=self.peak_threshold_kw,
            near_peak_threshold_kw=self.near_peak_threshold_kw,
            is_predicted_peak=is_peak,
            peak_status=status,
            mode="historical_backtest",
        )

    def get_expected_peak(
        self,
        start_timestamp: Optional[str] = None,
        window_hours: float = 2.0,
    ) -> ExpectedPeakWindowResult:
        """
        Evaluates the upcoming window (default: next 2 hours = 8 15-minute intervals)
        to identify the expected maximum demand and whether a peak event is anticipated.
        """
        # Determine starting point
        if start_timestamp:
            rec = replay_service.get_record_by_timestamp(start_timestamp)
            if not rec:
                raise ValueError(f"Timestamp '{start_timestamp}' not found in replay stream.")
            start_ts = rec.timestamp
        else:
            start_ts = replay_service.get_current_record().timestamp

        # 2 hours of 15m intervals = 8 steps
        intervals_count = int(window_hours * 4)

        # Retrieve sequential sample from replay records
        records = replay_service.get_sample_records(limit=intervals_count, advance=False)
        
        # If specific start_timestamp was provided, slice from that record
        if start_timestamp:
            all_recs = replay_service._records
            start_idx = replay_service._index_by_timestamp.get(start_ts, 0)
            records = [
                all_recs[(start_idx + i) % len(all_recs)]
                for i in range(intervals_count)
            ]

        interval_details = []
        max_demand = -1.0
        peak_ts = start_ts

        for r in records:
            pred = forecast_service.predict_demand(r.timestamp)
            status = self.classify_peak_demand(pred.predicted_demand_kw)

            if pred.predicted_demand_kw > max_demand:
                max_demand = pred.predicted_demand_kw
                peak_ts = r.timestamp

            interval_details.append({
                "timestamp": r.timestamp,
                "predicted_demand_kw": pred.predicted_demand_kw,
                "actual_demand_kw": pred.actual_demand_kw,
                "peak_status": status,
            })

        is_peak_expected = (max_demand >= self.peak_threshold_kw)

        return ExpectedPeakWindowResult(
            window_start=records[0].timestamp,
            window_end=records[-1].timestamp,
            predicted_peak_demand_kw=round(max_demand, 4),
            predicted_peak_timestamp=peak_ts,
            peak_threshold_kw=self.peak_threshold_kw,
            near_peak_threshold_kw=self.near_peak_threshold_kw,
            is_peak_expected=is_peak_expected,
            window_intervals_count=len(interval_details),
            mode="historical_backtest",
            intervals=interval_details,
        )


# Singleton instance
peak_service = PeakDetectionService()
