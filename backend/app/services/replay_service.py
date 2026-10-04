"""
replay_service.py
-----------------
ENERSENSE Historical Telemetry Replay Service.

Replays real historical 15-minute building power telemetry from the I-BLEND dataset
(Academic Building, October 2016) sequentially, modeling a live ingestion stream
for demonstration without fabricating synthetic demand values.

Key Architecture:
  1. Real Telemetry Source:
     Reads verified 15-minute aggregated power readings from data/processed/academic_demo_15min.csv.
  2. October 2016 Window:
     Filters exactly 2016-10-01 00:00:00 to 2016-10-31 23:45:00 (2,976 records).
  3. Telemetry Stream Simulation:
     Maintains an in-memory sequential cursor advancing through the records.
  4. Decoupled Tariff Connection:
     Evaluates regulatory ToD tariff logic (October winter schedule) against each
     telemetry timestamp at the service layer without mixing pricing into raw telemetry.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import pandas as pd
from pydantic import BaseModel, Field

from app.services.tariff_service import (
    TariffConfig,
    TariffPeriodResult,
    get_october_tariff_config,
    get_tariff_for_timestamp,
)


class ReplayRecord(BaseModel):
    """Raw telemetry record replayed from historical I-BLEND data."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    building_name: str = Field("Academic Building", description="Building identifier")
    demand_kw: float = Field(..., description="Power demand in kW from real historical I-BLEND data")
    source: str = Field("I-BLEND", description="Telemetry data source")
    mode: str = Field("historical_replay", description="Operation mode")
    replay: bool = Field(True, description="Flag indicating simulated replay data")


class ReplayTariffSummary(BaseModel):
    """Tariff period evaluation attached to replayed telemetry."""
    period: str = Field(..., description="'off_peak', 'normal', or 'peak'")
    adjustment_percent: float = Field(..., description="Percentage adjustment on base rate (-20.0 for 20% rebate, 0.0 for normal)")
    base_energy_rate: Optional[float] = Field(None, description="Base energy rate in INR/kWh (None if unverified)")
    applicable_rate: Optional[float] = Field(None, description="Active energy rate in INR/kWh (None if unverified)")


class CombinedReplayRecord(BaseModel):
    """Combined telemetry and tariff evaluation for demo ingestion."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    building_name: str = Field("Academic Building", description="Building identifier")
    demand_kw: float = Field(..., description="Power demand in kW")
    source: str = Field("I-BLEND", description="Telemetry data source")
    mode: str = Field("historical_replay", description="Replay mode")
    replay: bool = Field(True, description="Replay flag")
    tariff: ReplayTariffSummary = Field(..., description="ToD tariff period breakdown")


class ReplayStatus(BaseModel):
    """Status metadata for the historical replay stream."""
    source: str = "I-BLEND"
    building: str = "Academic Building"
    replay_period: str = "2016-10-01 to 2016-10-31"
    start_timestamp: str
    end_timestamp: str
    total_records: int
    interval: str = "15m"
    current_position: int


class IBlendReplayService:
    """
    Manages sequential streaming of historical October 2016 I-BLEND telemetry records.
    """

    def __init__(self, csv_path: Optional[Path] = None):
        self._records: List[ReplayRecord] = []
        self._index_by_timestamp: Dict[str, int] = {}
        self._current_index: int = 0
        try:
            self._load_records(csv_path)
        except FileNotFoundError as e:
            print(f"Could not load CSV on init, dataset missing: {e}")
        except Exception as e:
            print(f"Error loading CSV on init: {e}")

    def _find_csv(self, override_path: Optional[Path] = None) -> Path:
        """Locates the processed CSV file across potential working directories."""
        if override_path and override_path.exists():
            return override_path

        candidates = [
            Path(__file__).resolve().parents[3] / "data" / "processed" / "academic_demo_15min.csv",
            Path("data/processed/academic_demo_15min.csv").resolve(),
            Path("../data/processed/academic_demo_15min.csv").resolve(),
        ]
        for p in candidates:
            if p.exists():
                return p
        raise FileNotFoundError(
            f"Processed I-BLEND CSV not found. Checked candidate paths: {[str(p) for p in candidates]}"
        )

    def _load_records(self, csv_path: Optional[Path] = None):
        """Loads and filters October 2016 records from academic_demo_15min.csv."""
        target = self._find_csv(csv_path)
        df = pd.read_csv(target)

        # Filter strictly for October 2016 in Asia/Kolkata
        oct_df = df[
            (df["timestamp"] >= "2016-10-01") & (df["timestamp"] < "2016-11-01")
        ].sort_values("timestamp")

        records: List[ReplayRecord] = []
        index_by_ts: Dict[str, int] = {}

        for idx, (_, row) in enumerate(oct_df.iterrows()):
            rec = ReplayRecord(
                timestamp=str(row["timestamp"]),
                building_name=str(row.get("building_name", "Academic Building")),
                demand_kw=round(float(row["demand_kw"]), 4),
                source=str(row.get("source", "I-BLEND")),
                mode="historical_replay",
                replay=True,
            )
            records.append(rec)
            index_by_ts[rec.timestamp] = idx

        self._records = records
        self._index_by_timestamp = index_by_ts
        self._current_index = 0

    @property
    def total_records(self) -> int:
        return len(self._records)

    @property
    def current_index(self) -> int:
        return self._current_index

    def get_status(self) -> ReplayStatus:
        """Returns metadata regarding the current replay state."""
        start_ts = self._records[0].timestamp if self._records else ""
        end_ts = self._records[-1].timestamp if self._records else ""
        return ReplayStatus(
            source="I-BLEND",
            building="Academic Building",
            replay_period="2016-10-01 to 2016-10-31",
            start_timestamp=start_ts,
            end_timestamp=end_ts,
            total_records=len(self._records),
            interval="15m",
            current_position=self._current_index,
        )

    def get_current_record(self) -> ReplayRecord:
        """Returns the telemetry record at the current position without advancing."""
        if not self._records:
            raise RuntimeError("No replay records available.")
        return self._records[self._current_index]

    def get_next_record(self) -> ReplayRecord:
        """
        Returns the current telemetry record and advances the position cursor by 1.
        Wraps around to 0 when the end of October 2016 is reached.
        """
        if not self._records:
            raise RuntimeError("No replay records available.")
        record = self._records[self._current_index]
        self._current_index = (self._current_index + 1) % len(self._records)
        return record

    def get_sample_records(self, limit: int = 10, advance: bool = False) -> List[ReplayRecord]:
        """
        Returns the next N records starting from the current position.
        
        Args:
            limit: Number of records to return (capped at total_records).
            advance: If True, advances cursor by limit.
        """
        if not self._records:
            return []
        
        count = max(1, min(limit, len(self._records)))
        start_pos = self._current_index
        sample = []
        for i in range(count):
            pos = (start_pos + i) % len(self._records)
            sample.append(self._records[pos])

        if advance:
            self._current_index = (start_pos + count) % len(self._records)

        return sample

    def get_record_by_timestamp(self, timestamp: str) -> Optional[ReplayRecord]:
        """Finds a specific telemetry record matching the given timestamp."""
        # Exact match
        if timestamp in self._index_by_timestamp:
            return self._records[self._index_by_timestamp[timestamp]]
        
        # Match normalized timestamp
        ts_clean = timestamp.strip().replace("Z", "+00:00")
        for rec in self._records:
            if rec.timestamp == ts_clean or rec.timestamp.startswith(timestamp):
                return rec
        return None

    def reset(self, position: int = 0):
        """Resets the replay cursor to a specific index."""
        if self._records:
            self._current_index = max(0, min(position, len(self._records) - 1))
        else:
            self._current_index = 0


# Singleton service instance
replay_service = IBlendReplayService()


def evaluate_telemetry_tariff(
    record: Union[ReplayRecord, Dict[str, Any]],
    tariff_config: Optional[TariffConfig] = None,
) -> CombinedReplayRecord:
    """
    Connects an I-BLEND replay telemetry record with the ToD tariff engine.
    
    Service-level flow:
      I-BLEND replay record -> timestamp -> October tariff engine
      -> period classification -> applicable rate / adjustment -> combined record
      
    No monetary ₹ cost is calculated when base_energy_rate is None.
    """
    if isinstance(record, dict):
        rec_obj = ReplayRecord(**record)
    else:
        rec_obj = record

    config = tariff_config or get_october_tariff_config()
    tariff_res: TariffPeriodResult = get_tariff_for_timestamp(
        timestamp=rec_obj.timestamp,
        tariff_config=config,
    )

    tariff_summary = ReplayTariffSummary(
        period=tariff_res.period,
        adjustment_percent=tariff_res.adjustment_percent,
        base_energy_rate=tariff_res.base_energy_rate,
        applicable_rate=tariff_res.applicable_rate,
    )

    return CombinedReplayRecord(
        timestamp=rec_obj.timestamp,
        building_name=rec_obj.building_name,
        demand_kw=rec_obj.demand_kw,
        source=rec_obj.source,
        mode=rec_obj.mode,
        replay=rec_obj.replay,
        tariff=tariff_summary,
    )


class CombinedContextRecord(BaseModel):
    """Combined telemetry, weather context, and tariff evaluation for demo ingestion."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    building_name: str = Field("Academic Building", description="Building identifier")
    demand_kw: float = Field(..., description="Power demand in kW")
    source: str = Field("I-BLEND", description="Telemetry data source")
    mode: str = Field("historical_replay", description="Replay mode")
    replay: bool = Field(True, description="Replay flag")
    weather: Any = Field(..., description="Historical weather observation from Open-Meteo")
    tariff: ReplayTariffSummary = Field(..., description="ToD tariff period breakdown")


def evaluate_telemetry_context(
    record: Union[ReplayRecord, Dict[str, Any]],
    tariff_config: Optional[TariffConfig] = None,
) -> CombinedContextRecord:
    """
    Combines an I-BLEND telemetry record with both October ToD tariff evaluation
    and historical Open-Meteo weather context.
    
    Reuses existing Stage 1 tariff evaluation and Stage 2 weather service.
    """
    from app.services.weather_service import WeatherContextSummary, weather_service

    combined_tariff = evaluate_telemetry_tariff(record, tariff_config)
    weather_resp = weather_service.get_weather_for_timestamp(combined_tariff.timestamp)

    weather_summary = WeatherContextSummary(
        temperature_c=weather_resp.weather.temperature_c,
        relative_humidity_percent=weather_resp.weather.relative_humidity_percent,
        rainfall_mm=weather_resp.weather.rainfall_mm,
        source=weather_resp.source,
    )

    return CombinedContextRecord(
        timestamp=combined_tariff.timestamp,
        building_name=combined_tariff.building_name,
        demand_kw=combined_tariff.demand_kw,
        source=combined_tariff.source,
        mode=combined_tariff.mode,
        replay=combined_tariff.replay,
        weather=weather_summary,
        tariff=combined_tariff.tariff,
    )

