"""
tariff_service.py
-----------------
ENERSENSE Time-of-Day (ToD) Tariff Engine.

This service manages Time-of-Day (ToD) tariff calculations based on official
regulatory schedules (e.g., Delhi Electricity Regulatory Commission / DERC).
It evaluates whether a given Asia/Kolkata timestamp falls into 'peak', 'off_peak',
or 'normal' periods, applies official percentage surcharges or rebates to a
configured base energy rate, and computes energy costs.

Key Principles:
1. Regulatory Provenance:
   Tariff parameters are referenced to official regulatory orders (e.g. DERC order for BRPL)
   rather than synthetic or invented historical rates.
2. No Invented Rates:
   If an official source provides percentage surcharges/rebates (+20% peak surcharge,
   20% off-peak rebate) without a verified base ₹/kWh rate, the base rate is represented
   as None (unverified / unavailable) rather than inventing arbitrary fallback numbers.
3. Explicit Rate Formulas:
   - peak_rate = base_energy_rate * (1 + peak_adjustment)
   - offpeak_rate = base_energy_rate * (1 - offpeak_rebate)
   - normal_rate = base_energy_rate
4. Timezone Safety:
   All timestamps are converted and evaluated against Asia/Kolkata (IST, UTC+05:30).
5. Separation of Concerns:
   Tariff configuration is strictly decoupled from physical energy measurements.
"""

from datetime import datetime, time, timedelta, timezone
from typing import List, Optional, Union
from pydantic import BaseModel, Field, computed_field

# Standard Indian Standard Time (IST) timezone (UTC+05:30)
try:
    from zoneinfo import ZoneInfo
    KOLKATA_TZ = ZoneInfo("Asia/Kolkata")
except Exception:
    KOLKATA_TZ = timezone(timedelta(hours=5, minutes=30), name="Asia/Kolkata")

# Provenance Note
DERC_PROVENANCE_NOTE = (
    "Tariff schedule modeled on DERC (Delhi Electricity Regulatory Commission) ToD orders "
    "for BSES Rajdhani Power Limited (BRPL). Base energy rate and demand charge must be "
    "verified against official facility electricity bills before calculating monetary figures. "
    "This is NOT the historical tariff of the I-BLEND dataset."
)


class TimeWindow(BaseModel):
    """Represents a time-of-day window [start, end)."""
    start: time = Field(..., description="Start of window (inclusive)")
    end: time = Field(..., description="End of window (exclusive)")
    name: Optional[str] = Field(None, description="Descriptive label, e.g. 'Afternoon Peak'")

    class Config:
        json_encoders = {
            time: lambda t: t.strftime("%H:%M:%S")
        }


class TariffConfig(BaseModel):
    """
    Data model representing a Time-of-Day (ToD) tariff structure for a facility.
    
    Supports:
      - DISCOM / utility name
      - Consumer category
      - Peak, off-peak, and normal periods
      - Peak surcharge (+%) and off-peak rebate (-%)
      - Base energy rate (None if unverified)
      - Demand charge (None if unverified)
      - Effective dates and source provenance tracking
    """
    building_name: str = Field("Academic Building", description="Building identifier")
    utility: str = Field("BSES Rajdhani Power Limited (BRPL)", description="Electric utility / DISCOM name")
    consumer_category: str = Field("Non-Domestic / Institutional (HT/LT)", description="Consumer tariff category")
    
    # Time windows
    peak_windows: List[TimeWindow] = Field(default_factory=list, description="List of peak time windows")
    offpeak_windows: List[TimeWindow] = Field(default_factory=list, description="List of off-peak time windows")
    
    # Optional single-window helpers for convenience
    peak_start: Optional[time] = Field(None, description="Optional single peak start time")
    peak_end: Optional[time] = Field(None, description="Optional single peak end time")
    offpeak_start: Optional[time] = Field(None, description="Optional single off-peak start time")
    offpeak_end: Optional[time] = Field(None, description="Optional single off-peak end time")
    
    # Multipliers / Adjustments (e.g. +0.20 = +20% surcharge, 0.20 = 20% rebate)
    peak_adjustment: float = Field(0.20, description="Peak surcharge as fraction (e.g., 0.20 for +20%)")
    offpeak_rebate: float = Field(0.20, description="Off-peak rebate as fraction (e.g., 0.20 for 20% rebate)")
    
    # Absolute rates (None if unverified)
    base_energy_rate: Optional[float] = Field(None, description="Base energy charge in INR/kWh (None if unverified)")
    demand_charge: Optional[float] = Field(None, description="Monthly demand charge in INR/kW or INR/kVA (None if unverified)")
    currency: str = Field("INR", description="Currency code")
    
    # Provenance
    effective_from: Optional[str] = Field("2023-04-01", description="Effective start date of tariff order")
    effective_to: Optional[str] = Field(None, description="Effective end date of tariff order if specified")
    source: str = Field("Delhi Electricity Regulatory Commission (DERC) Tariff Order for BRPL", description="Regulatory authority / order")
    source_url: Optional[str] = Field("http://www.derc.gov.in/", description="Source URL for regulatory documentation")
    is_verified: bool = Field(False, description="True if base rates have been verified against facility electricity bills")
    note: str = Field(DERC_PROVENANCE_NOTE, description="Context note regarding tariff provenance")

    class Config:
        json_encoders = {
            time: lambda t: t.strftime("%H:%M:%S")
        }

    @computed_field
    @property
    def peak_rate(self) -> Optional[float]:
        """Calculates peak_rate = base_energy_rate * (1 + peak_adjustment)."""
        if self.base_energy_rate is None:
            return None
        return round(self.base_energy_rate * (1.0 + self.peak_adjustment), 4)

    @computed_field
    @property
    def offpeak_rate(self) -> Optional[float]:
        """Calculates offpeak_rate = base_energy_rate * (1 - offpeak_rebate)."""
        if self.base_energy_rate is None:
            return None
        return round(self.base_energy_rate * (1.0 - self.offpeak_rebate), 4)

    @computed_field
    @property
    def normal_rate(self) -> Optional[float]:
        """Normal period uses base_energy_rate without adjustment."""
        if self.base_energy_rate is None:
            return None
        return round(self.base_energy_rate, 4)

    def get_effective_peak_windows(self) -> List[TimeWindow]:
        """Returns all effective peak time windows."""
        windows = list(self.peak_windows)
        if self.peak_start is not None and self.peak_end is not None:
            if not any(w.start == self.peak_start and w.end == self.peak_end for w in windows):
                windows.append(TimeWindow(start=self.peak_start, end=self.peak_end, name="Peak Window"))
        return windows

    def get_effective_offpeak_windows(self) -> List[TimeWindow]:
        """Returns all effective off-peak time windows."""
        windows = list(self.offpeak_windows)
        if self.offpeak_start is not None and self.offpeak_end is not None:
            if not any(w.start == self.offpeak_start and w.end == self.offpeak_end for w in windows):
                windows.append(TimeWindow(start=self.offpeak_start, end=self.offpeak_end, name="Off-Peak Window"))
        return windows


class TariffPeriodResult(BaseModel):
    """Result schema for tariff evaluation at a specific timestamp."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    period: str = Field(..., description="'peak', 'off_peak', or 'normal'")
    is_peak: bool = Field(..., description="True if inside peak period, False otherwise")
    adjustment_percent: float = Field(0.0, description="Percentage adjustment on base rate (-20.0 for 20% rebate, 0.0 for normal, +20.0 for peak)")
    base_energy_rate: Optional[float] = Field(None, description="Base energy rate in INR/kWh (None if unverified)")
    applicable_rate: Optional[float] = Field(None, description="Active energy tariff in INR per kWh, or None if unverified")
    demand_charge: Optional[float] = Field(None, description="Contracted demand charge in INR per kW/month, or None if unverified")
    currency: str = "INR"
    utility: Optional[str] = Field(None, description="Electric utility / DISCOM name")
    consumer_category: Optional[str] = Field(None, description="Consumer category")
    effective_from: Optional[str] = Field(None, description="Effective from date")
    effective_to: Optional[str] = Field(None, description="Effective to date")
    source: Optional[str] = Field(None, description="Regulatory authority / order")
    source_url: Optional[str] = Field(None, description="Source URL")
    is_verified: bool = Field(False, description="True if verified against official bill")
    note: Optional[str] = Field(None, description="Context note regarding tariff provenance")


class EnergyCostResult(BaseModel):
    """Result schema for energy cost calculation over an interval."""
    timestamp: str
    demand_kw: float
    interval_hours: float
    energy_kwh: float
    period: str
    is_peak: bool
    applicable_rate: Optional[float] = None
    energy_cost: Optional[float] = None
    currency: str = "INR"
    utility: Optional[str] = None
    source: Optional[str] = None
    note: Optional[str] = None


class PeakCostDifferenceResult(BaseModel):
    """Result schema comparing energy cost under peak vs off-peak rates."""
    demand_kw: float
    interval_hours: float
    energy_kwh: float
    peak_rate: Optional[float] = None
    offpeak_rate: Optional[float] = None
    rate_difference: Optional[float] = None
    peak_cost: Optional[float] = None
    offpeak_cost: Optional[float] = None
    cost_difference: Optional[float] = None
    currency: str = "INR"
    utility: Optional[str] = None
    source: Optional[str] = None
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# October Regulatory Tariff Configuration (BRPL / DERC Winter Schedule)
# ---------------------------------------------------------------------------
# Modeled strictly after official DERC ToD order for BSES Rajdhani Power Limited (BRPL).
# October / winter-season schedule:
#   00:00–06:00: Off-Peak (20% rebate on base energy rate)
#   06:00–18:00: Normal (base energy rate)
#   18:00–24:00: Normal (base energy rate — no peak surcharge in October)
# Base rate is explicitly set to None (unverified) until verified from facility bills.
OCTOBER_BRPL_DEMO_TARIFF = TariffConfig(
    building_name="Academic Building",
    utility="BSES Rajdhani Power Limited (BRPL)",
    consumer_category="Non-Domestic / Institutional (HT/LT)",
    peak_windows=[],  # No peak period in October / winter schedule per DERC
    offpeak_windows=[
        TimeWindow(start=time(0, 0, 0), end=time(6, 0, 0), name="Night/Morning Off-Peak"),
    ],
    peak_adjustment=0.00,       # 0% peak surcharge in October
    offpeak_rebate=0.20,        # 20% DERC rebate for off-peak hours (00:00–06:00)
    base_energy_rate=None,      # Unverified — configure from facility DISCOM bill
    demand_charge=None,         # Unverified — configure from contracted sanctioned load
    currency="INR",
    effective_from="2016-10-01",
    effective_to="2016-10-31",
    source="Delhi Electricity Regulatory Commission (DERC) Tariff Order for BRPL (October/Winter Schedule)",
    source_url="http://www.derc.gov.in/",
    is_verified=False,
    note=(
        "Tariff schedule is a configurable regulatory reference for demonstration. "
        "October / winter-season schedule for BRPL: 00:00–06:00 off-peak (-20% rebate), "
        "06:00–24:00 normal (0% adjustment). "
        "Verify the applicable DISCOM tariff and consumer category before deployment. "
        "This is NOT the historical tariff of the I-BLEND dataset."
    ),
)

# Set October BRPL demo tariff as default configuration for demo
DEFAULT_BRPL_TARIFF = OCTOBER_BRPL_DEMO_TARIFF


def get_default_tariff_config(building_name: Optional[str] = None) -> TariffConfig:
    """
    Returns the default regulatory tariff configuration (October BRPL demo tariff).
    
    Base energy rate is unverified (None) by default to prevent fictitious rate claims.
    """
    if building_name and building_name != DEFAULT_BRPL_TARIFF.building_name:
        return DEFAULT_BRPL_TARIFF.model_copy(update={"building_name": building_name})
    return DEFAULT_BRPL_TARIFF


def get_october_tariff_config(building_name: Optional[str] = None) -> TariffConfig:
    """Returns the October BRPL demo tariff configuration."""
    if building_name and building_name != OCTOBER_BRPL_DEMO_TARIFF.building_name:
        return OCTOBER_BRPL_DEMO_TARIFF.model_copy(update={"building_name": building_name})
    return OCTOBER_BRPL_DEMO_TARIFF


def get_demo_tariff_config(building_name: Optional[str] = None) -> TariffConfig:
    """Backwards-compatible alias for get_default_tariff_config."""
    return get_default_tariff_config(building_name=building_name)


def parse_and_localize_timestamp(timestamp: Union[str, datetime, None]) -> datetime:
    """
    Safely parses an input timestamp and localizes it to Asia/Kolkata (IST).
    
    Timestamps are converted explicitly to Asia/Kolkata (+05:30) so that UTC
    or other timezone offsets are never silently mistaken for local facility time.
    """
    if timestamp is None:
        return datetime.now(KOLKATA_TZ)

    if isinstance(timestamp, str):
        ts_clean = timestamp.strip().replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(ts_clean)
        except ValueError as exc:
            raise ValueError(f"Invalid timestamp format '{timestamp}'. Expected ISO-8601 format.") from exc
    elif isinstance(timestamp, datetime):
        dt = timestamp
    else:
        raise ValueError(f"Unsupported timestamp type: {type(timestamp)}. Expected str or datetime.")

    if dt.tzinfo is None:
        return dt.replace(tzinfo=KOLKATA_TZ)

    return dt.astimezone(KOLKATA_TZ)


def is_time_in_window(t: time, start: time, end: time) -> bool:
    """
    Determines whether a time-of-day falls inside [start, end).
    Handles both standard daytime windows and overnight windows crossing midnight.
    """
    if start < end:
        return start <= t < end
    elif start > end:
        # Crosses midnight (e.g. 22:00 to 01:00)
        return t >= start or t < end
    return False


def is_time_in_windows(t: time, windows: List[TimeWindow]) -> bool:
    """Checks if a time falls into any of the specified time windows."""
    return any(is_time_in_window(t, w.start, w.end) for w in windows)


def is_in_peak_period(current_time: time, peak_start: time, peak_end: time) -> bool:
    """Helper checking single peak window for backwards compatibility."""
    return is_time_in_window(current_time, peak_start, peak_end)


def get_tariff_for_timestamp(
    timestamp: Union[str, datetime, None] = None,
    tariff_config: Optional[TariffConfig] = None,
) -> TariffPeriodResult:
    """
    Evaluates which tariff period applies for a specific timestamp in Asia/Kolkata:
      - 'peak': Inside peak windows (applies peak surcharge)
      - 'off_peak': Inside off-peak windows (applies off-peak rebate)
      - 'normal': All other hours (base energy rate)
      
    Returns TariffPeriodResult with applicable_rate (None if unverified),
    period classification, demand charge, and complete regulatory provenance.
    """
    config = tariff_config or get_default_tariff_config()
    localized_dt = parse_and_localize_timestamp(timestamp)
    time_of_day = localized_dt.time()

    peak_windows = config.get_effective_peak_windows()
    offpeak_windows = config.get_effective_offpeak_windows()

    if is_time_in_windows(time_of_day, peak_windows):
        period = "peak"
        is_peak = True
        applicable_rate = config.peak_rate
        adjustment_percent = round(config.peak_adjustment * 100, 2)
    elif is_time_in_windows(time_of_day, offpeak_windows):
        period = "off_peak"
        is_peak = False
        applicable_rate = config.offpeak_rate
        adjustment_percent = -round(config.offpeak_rebate * 100, 2)
    else:
        period = "normal"
        is_peak = False
        applicable_rate = config.normal_rate
        adjustment_percent = 0.0

    return TariffPeriodResult(
        timestamp=localized_dt.isoformat(),
        period=period,
        is_peak=is_peak,
        adjustment_percent=adjustment_percent,
        base_energy_rate=config.base_energy_rate,
        applicable_rate=applicable_rate,
        demand_charge=config.demand_charge,
        currency=config.currency,
        utility=config.utility,
        consumer_category=config.consumer_category,
        effective_from=config.effective_from,
        effective_to=config.effective_to,
        source=config.source,
        source_url=config.source_url,
        is_verified=config.is_verified,
        note=config.note,
    )


def calculate_energy_cost(
    demand_kw: float,
    interval_hours: float,
    tariff_config: Optional[TariffConfig] = None,
    timestamp: Union[str, datetime, None] = None,
    raise_if_unavailable: bool = True,
) -> EnergyCostResult:
    """
    Calculates the exact energy cost for a given power demand over an interval:
        energy_kwh = demand_kw * interval_hours
        energy_cost = energy_kwh * applicable_rate

    If base_energy_rate is unverified/unavailable (None):
      - If raise_if_unavailable=True: raises a clear ValueError explaining the missing rate.
      - If raise_if_unavailable=False: returns EnergyCostResult with energy_cost=None.
    """
    if interval_hours <= 0:
        raise ValueError("interval_hours must be greater than zero.")
    if demand_kw < 0:
        raise ValueError("demand_kw cannot be negative.")

    config = tariff_config or get_default_tariff_config()
    tariff_info = get_tariff_for_timestamp(timestamp, config)

    energy_kwh = round(demand_kw * interval_hours, 4)

    if tariff_info.applicable_rate is None:
        if raise_if_unavailable:
            raise ValueError(
                f"Cannot calculate monetary energy cost: base_energy_rate is unverified (None) "
                f"for {config.utility} ({config.consumer_category}). Please configure base_energy_rate."
            )
        energy_cost = None
    else:
        energy_cost = round(energy_kwh * tariff_info.applicable_rate, 4)

    return EnergyCostResult(
        timestamp=tariff_info.timestamp,
        demand_kw=round(demand_kw, 4),
        interval_hours=interval_hours,
        energy_kwh=energy_kwh,
        period=tariff_info.period,
        is_peak=tariff_info.is_peak,
        applicable_rate=tariff_info.applicable_rate,
        energy_cost=energy_cost,
        currency=config.currency,
        utility=config.utility,
        source=config.source,
        note=config.note,
    )


def calculate_peak_cost_difference(
    demand_kw: float,
    interval_hours: float,
    tariff_config: Optional[TariffConfig] = None,
    raise_if_unavailable: bool = True,
) -> PeakCostDifferenceResult:
    """
    Compares the energy cost for the same consumption under peak vs. off-peak rates:
        peak_cost = energy_kwh * peak_rate
        offpeak_cost = energy_kwh * offpeak_rate
        cost_difference = peak_cost - offpeak_cost

    If base_energy_rate is unverified/unavailable (None):
      - If raise_if_unavailable=True: raises a clear ValueError explaining the missing rate.
      - If raise_if_unavailable=False: returns PeakCostDifferenceResult with None values.
    """
    if interval_hours <= 0:
        raise ValueError("interval_hours must be greater than zero.")
    if demand_kw < 0:
        raise ValueError("demand_kw cannot be negative.")

    config = tariff_config or get_default_tariff_config()
    energy_kwh = round(demand_kw * interval_hours, 4)

    if config.peak_rate is None or config.offpeak_rate is None:
        if raise_if_unavailable:
            raise ValueError(
                f"Cannot calculate peak cost difference: base_energy_rate is unverified (None) "
                f"for {config.utility}. Please configure base_energy_rate."
            )
        return PeakCostDifferenceResult(
            demand_kw=round(demand_kw, 4),
            interval_hours=interval_hours,
            energy_kwh=energy_kwh,
            peak_rate=None,
            offpeak_rate=None,
            rate_difference=None,
            peak_cost=None,
            offpeak_cost=None,
            cost_difference=None,
            currency=config.currency,
            utility=config.utility,
            source=config.source,
            note=config.note,
        )

    peak_cost = round(energy_kwh * config.peak_rate, 4)
    offpeak_cost = round(energy_kwh * config.offpeak_rate, 4)
    cost_difference = round(peak_cost - offpeak_cost, 4)
    rate_difference = round(config.peak_rate - config.offpeak_rate, 4)

    return PeakCostDifferenceResult(
        demand_kw=round(demand_kw, 4),
        interval_hours=interval_hours,
        energy_kwh=energy_kwh,
        peak_rate=config.peak_rate,
        offpeak_rate=config.offpeak_rate,
        rate_difference=rate_difference,
        peak_cost=peak_cost,
        offpeak_cost=offpeak_cost,
        cost_difference=cost_difference,
        currency=config.currency,
        utility=config.utility,
        source=config.source,
        note=config.note,
    )
