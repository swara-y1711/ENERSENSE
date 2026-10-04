"""
recommendation_service.py
-------------------------
ENERSENSE Actionable Recommendations Engine (Stage 5).

Turns Stage 1–4 intelligence (forecast, peak classification, potential flexibility,
tariff period, weather/season) into simple, explainable, advisory recommendations.

Core Principles:
  1. Rule-based and explainable — no additional ML model.
  2. Advisory only — never claims equipment control or guaranteed load shedding.
  3. No invented monetary savings (no ₹ / INR cost claims).
  4. Reuses existing Stage 1–4 services; does not duplicate forecast/peak/flex/tariff/weather logic.
  5. Historical backtest / replay mode only for this MVP.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.services.flexibility_service import flexibility_service
from app.services.peak_service import peak_service
from app.services.tariff_service import get_tariff_for_timestamp, parse_and_localize_timestamp
from app.services.weather_service import WeatherServiceError, weather_service

MODE = "historical_backtest"
METHOD = "rule_based_stage5"
SEASON_OCTOBER_DELHI = "post_monsoon"

# Potential flexibility below this is treated as no meaningful shift signal.
MEANINGFUL_FLEX_KW = 3.0
HOT_TEMP_C = 32.0
WARM_TEMP_C = 28.0
RAIN_MM = 0.5

ADVISORY_NOTICE = (
    "Advisory recommendations only. ENERSENSE does not control building equipment "
    "and does not claim that potential flexible demand is guaranteed to be controllable. "
    "No monetary calculations are provided."
)

FORBIDDEN_CONTROL_PHRASES = (
    "turn off",
    "switch off",
    "stop ev",
    "shut down",
    "dispatch command",
    "automatically control",
)


class Recommendation(BaseModel):
    """A single advisory recommendation for occupants and/or facility managers."""

    recommendation_id: str
    priority: str = Field(..., description="'high', 'medium', 'low', or 'none'")
    audience: str = Field(..., description="'occupant', 'facility_manager', or 'both'")
    action: str
    reason: str
    expected_window: Optional[str] = None
    peak_status: str
    predicted_demand_kw: float
    potential_flexible_kw: float
    tariff_period: str
    season: str
    weather_context: Optional[Dict[str, Any]] = None
    evidence: str
    method: str = METHOD
    mode: str = MODE


class RecommendationBundle(BaseModel):
    """API payload for current or expected recommendations."""

    timestamp: str
    peak_status: str
    predicted_demand_kw: float
    potential_flexible_kw: float
    historical_reference_demand_kw: float
    tariff_period: str
    is_weekend: bool
    season: str
    weather_context: Optional[Dict[str, Any]] = None
    upcoming_peak_expected: bool = False
    upcoming_peak_timestamp: Optional[str] = None
    expected_window: Optional[str] = None
    overall_priority: str = "none"
    recommendations: List[Recommendation] = Field(default_factory=list)
    mode: str = MODE
    notice: str = ADVISORY_NOTICE


class RecommendationEngine:
    """Transparent rule-based recommendation engine over Stage 1–4 outputs."""

    def get_current_recommendations(self, timestamp: Optional[str] = None) -> RecommendationBundle:
        """Recommendations for the active replay timestamp (or an explicit October 2016 timestamp)."""
        peak = peak_service.detect_peak(timestamp=timestamp)
        expected = peak_service.get_expected_peak(
            start_timestamp=peak.timestamp,
            window_hours=2.0,
        )
        return self._build_bundle(
            focal_timestamp=peak.timestamp,
            expected_window_result=expected,
        )

    def get_expected_recommendations(
        self,
        start_timestamp: Optional[str] = None,
        window_hours: float = 2.0,
    ) -> RecommendationBundle:
        """
        Recommendations for the upcoming replay window, focused on the interval
        with the highest predicted demand.
        """
        expected = peak_service.get_expected_peak(
            start_timestamp=start_timestamp,
            window_hours=window_hours,
        )
        return self._build_bundle(
            focal_timestamp=expected.predicted_peak_timestamp,
            expected_window_result=expected,
        )

    def _build_bundle(
        self,
        focal_timestamp: str,
        expected_window_result: Any,
    ) -> RecommendationBundle:
        peak = peak_service.detect_peak(timestamp=focal_timestamp)
        flex = flexibility_service.estimate_flexibility(timestamp=focal_timestamp)
        tariff = get_tariff_for_timestamp(timestamp=focal_timestamp)
        localized = parse_and_localize_timestamp(focal_timestamp)
        is_weekend = localized.weekday() >= 5
        weather_context = self._weather_context(focal_timestamp)

        window_label = (
            f"{expected_window_result.window_start} to {expected_window_result.window_end}"
        )
        upcoming_peak = bool(expected_window_result.is_peak_expected)
        upcoming_ts = (
            expected_window_result.predicted_peak_timestamp if upcoming_peak else None
        )

        recs = self._apply_rules(
            timestamp=peak.timestamp,
            peak_status=peak.peak_status,
            predicted_demand_kw=peak.predicted_demand_kw,
            potential_flexible_kw=flex.potential_flexible_kw,
            tariff_period=tariff.period,
            is_weekend=is_weekend,
            weather_context=weather_context,
            peak_threshold_kw=peak.peak_threshold_kw,
            near_peak_threshold_kw=peak.near_peak_threshold_kw,
            window_label=window_label,
            upcoming_peak=upcoming_peak,
            upcoming_peak_timestamp=expected_window_result.predicted_peak_timestamp,
        )

        overall = self._overall_priority(recs)
        return RecommendationBundle(
            timestamp=peak.timestamp,
            peak_status=peak.peak_status,
            predicted_demand_kw=peak.predicted_demand_kw,
            potential_flexible_kw=flex.potential_flexible_kw,
            historical_reference_demand_kw=flex.historical_reference_demand_kw,
            tariff_period=tariff.period,
            is_weekend=is_weekend,
            season=SEASON_OCTOBER_DELHI,
            weather_context=weather_context,
            upcoming_peak_expected=upcoming_peak,
            upcoming_peak_timestamp=upcoming_ts,
            expected_window=window_label,
            overall_priority=overall,
            recommendations=recs,
            mode=MODE,
            notice=ADVISORY_NOTICE,
        )

    def _weather_context(self, timestamp: str) -> Optional[Dict[str, Any]]:
        try:
            resp = weather_service.get_weather_for_timestamp(timestamp)
        except WeatherServiceError:
            return None

        temp = resp.weather.temperature_c
        rain = resp.weather.rainfall_mm
        if rain >= RAIN_MM:
            label = "rainy"
        elif temp >= HOT_TEMP_C:
            label = "hot"
        elif temp >= WARM_TEMP_C:
            label = "warm"
        else:
            label = "mild"

        return {
            "temperature_c": resp.weather.temperature_c,
            "relative_humidity_percent": resp.weather.relative_humidity_percent,
            "rainfall_mm": resp.weather.rainfall_mm,
            "label": label,
            "source": resp.source,
            "season": SEASON_OCTOBER_DELHI,
        }

    def _apply_rules(
        self,
        timestamp: str,
        peak_status: str,
        predicted_demand_kw: float,
        potential_flexible_kw: float,
        tariff_period: str,
        is_weekend: bool,
        weather_context: Optional[Dict[str, Any]],
        peak_threshold_kw: float,
        near_peak_threshold_kw: float,
        window_label: str,
        upcoming_peak: bool,
        upcoming_peak_timestamp: str,
    ) -> List[Recommendation]:
        meaningful_flex = potential_flexible_kw >= MEANINGFUL_FLEX_KW
        recs: List[Recommendation] = []

        comfortably_below = peak_status == "below_peak" and not upcoming_peak
        if comfortably_below:
            return []

        def make_rec(
            rec_id: str,
            priority: str,
            audience: str,
            action: str,
            reason: str,
            evidence: str,
        ) -> Recommendation:
            text = f"{action} {reason} {evidence}".lower()
            for phrase in FORBIDDEN_CONTROL_PHRASES:
                if phrase in text:
                    raise RuntimeError(f"Recommendation engine produced forbidden control language: {phrase}")
            if "₹" in text or "savings" in text or "rupee" in text or "inr" in text or "energy_cost" in text:
                raise RuntimeError("Recommendation engine must not mention monetary savings or rates.")

            return Recommendation(
                recommendation_id=rec_id,
                priority=priority,
                audience=audience,
                action=action,
                reason=reason,
                expected_window=window_label,
                peak_status=peak_status,
                predicted_demand_kw=predicted_demand_kw,
                potential_flexible_kw=potential_flexible_kw,
                tariff_period=tariff_period,
                season=SEASON_OCTOBER_DELHI,
                weather_context=weather_context,
                evidence=evidence,
                method=METHOD,
                mode=MODE,
            )

        day_note = "weekend" if is_weekend else "weekday"
        tariff_note = (
            f"October demo tariff period is '{tariff_period}' "
            "(time-of-use schedule context)."
        )
        flex_note = (
            f"Estimated potential flexible demand is {potential_flexible_kw:.2f} kW "
            "versus the historical slot median (not guaranteed controllable load)."
        )
        evidence_peak = (
            f"Rule-based on Stage 3 forecast and Stage 4 peak status '{peak_status}' "
            f"(near-peak threshold {near_peak_threshold_kw} kW, peak threshold {peak_threshold_kw} kW); "
            f"flexibility via historical slot median differential; {tariff_note} "
            f"Calendar context: {day_note} during {SEASON_OCTOBER_DELHI} season."
        )

        if peak_status == "predicted_peak":
            occupant_action = (
                "Consider shifting flexible loads outside the expected peak window. "
                "If EV charging is available, consider charging after the expected peak."
            )
            occupant_reason = (
                f"Predicted demand is {predicted_demand_kw:.2f} kW, which meets the empirical peak "
                f"threshold. {flex_note if meaningful_flex else 'Keep additional non-essential load low until after the peak.'} "
                f"{tariff_note}"
            )
            recs.append(
                make_rec(
                    rec_id=f"peak-occupant-{timestamp}",
                    priority="high",
                    audience="occupant",
                    action=occupant_action,
                    reason=occupant_reason,
                    evidence=evidence_peak,
                )
            )

            fm_action = (
                "Facility manager: review potential flexible loads before the predicted peak. "
                "Consider deferring non-critical flexible loads until after the peak period."
            )
            fm_reason = (
                f"Forecast classifies this interval as predicted_peak "
                f"({predicted_demand_kw:.2f} kW >= {peak_threshold_kw} kW). {flex_note} {tariff_note}"
            )
            recs.append(
                make_rec(
                    rec_id=f"peak-facility-{timestamp}",
                    priority="high",
                    audience="facility_manager",
                    action=fm_action,
                    reason=fm_reason,
                    evidence=evidence_peak,
                )
            )

        elif peak_status == "near_peak":
            occupant_action = (
                "Consider avoiding extra non-critical flexible loads until demand eases below the near-peak range."
            )
            occupant_reason = (
                f"Predicted demand is {predicted_demand_kw:.2f} kW (near-peak). {tariff_note}"
            )
            recs.append(
                make_rec(
                    rec_id=f"nearpeak-occupant-{timestamp}",
                    priority="medium",
                    audience="occupant",
                    action=occupant_action,
                    reason=occupant_reason,
                    evidence=evidence_peak,
                )
            )
            fm_action = (
                "Facility manager: monitor approaching peak conditions and review potential flexible demand."
            )
            fm_reason = (
                f"Demand is near the empirical 90th percentile ({near_peak_threshold_kw} kW). {flex_note} {tariff_note}"
            )
            recs.append(
                make_rec(
                    rec_id=f"nearpeak-facility-{timestamp}",
                    priority="medium",
                    audience="facility_manager",
                    action=fm_action,
                    reason=fm_reason,
                    evidence=evidence_peak,
                )
            )

        elif upcoming_peak:
            occupant_action = (
                "A peak is expected soon. Consider deferring non-critical flexible loads until after the peak period. "
                "If EV charging is available, consider charging after the expected peak."
            )
            occupant_reason = (
                f"Upcoming peak around {upcoming_peak_timestamp} within {window_label}. {tariff_note}"
            )
            recs.append(
                make_rec(
                    rec_id=f"upcoming-occupant-{timestamp}",
                    priority="medium",
                    audience="occupant",
                    action=occupant_action,
                    reason=occupant_reason,
                    evidence=evidence_peak + f" Upcoming window peak at {upcoming_peak_timestamp}.",
                )
            )
            fm_action = (
                "Facility manager: review flexible loads before the predicted peak in the upcoming window."
            )
            fm_reason = (
                f"Stage 4 expected-peak analysis flags a peak in {window_label}. {flex_note} {tariff_note}"
            )
            recs.append(
                make_rec(
                    rec_id=f"upcoming-facility-{timestamp}",
                    priority="high",
                    audience="facility_manager",
                    action=fm_action,
                    reason=fm_reason,
                    evidence=evidence_peak + f" Upcoming window peak at {upcoming_peak_timestamp}.",
                )
            )

        if recs and meaningful_flex and peak_status in ("predicted_peak", "near_peak"):
            recs.append(
                make_rec(
                    rec_id=f"flex-both-{timestamp}",
                    priority="medium" if peak_status == "near_peak" else "high",
                    audience="both",
                    action=(
                        "Consider shifting an estimated portion of potential flexible demand "
                        "outside the expected peak window."
                    ),
                    reason=flex_note + " This is an empirical estimate, not a control setpoint.",
                    evidence=(
                        "Stage 4 potential_flexible_kw = max(predicted_demand_kw - "
                        "historical_slot_median, 0). Not guaranteed controllable load."
                    ),
                )
            )

        if recs and weather_context:
            label = weather_context.get("label")
            temp = weather_context.get("temperature_c")
            rain = weather_context.get("rainfall_mm")
            if label == "hot" and peak_status in ("predicted_peak", "near_peak"):
                recs.append(
                    make_rec(
                        rec_id=f"weather-hot-{timestamp}",
                        priority="medium",
                        audience="both",
                        action=(
                            "Consider avoiding additional non-essential cooling load during the predicted peak."
                        ),
                        reason=(
                            f"Open-Meteo historical context is hot ({temp} °C) in {SEASON_OCTOBER_DELHI} season. "
                            "This is weather context only, not equipment telemetry."
                        ),
                        evidence="Stage 2 Open-Meteo historical weather + Stage 4 peak status.",
                    )
                )
            elif label == "rainy" and peak_status in ("predicted_peak", "near_peak", "below_peak") and (
                peak_status != "below_peak" or upcoming_peak
            ):
                recs.append(
                    make_rec(
                        rec_id=f"weather-rain-{timestamp}",
                        priority="low",
                        audience="both",
                        action=(
                            "Consider deferring non-critical flexible activities during rainy conditions "
                            "around the predicted peak."
                        ),
                        reason=(
                            f"Open-Meteo historical rainfall is {rain} mm. "
                            "No appliance-level telemetry is available."
                        ),
                        evidence="Stage 2 Open-Meteo historical weather; advisory only.",
                    )
                )
            elif label == "warm" and peak_status == "predicted_peak":
                recs.append(
                    make_rec(
                        rec_id=f"weather-warm-{timestamp}",
                        priority="low",
                        audience="occupant",
                        action=(
                            "Consider avoiding additional non-essential cooling load during the predicted peak."
                        ),
                        reason=(
                            f"Open-Meteo historical temperature is {temp} °C ({SEASON_OCTOBER_DELHI}). "
                            "Weather context only."
                        ),
                        evidence="Stage 2 Open-Meteo historical weather + Stage 4 peak status.",
                    )
                )

        if recs and is_weekend and peak_status in ("predicted_peak", "near_peak"):
            recs.append(
                make_rec(
                    rec_id=f"weekend-{timestamp}",
                    priority="low",
                    audience="facility_manager",
                    action=(
                        "Weekend occupancy may differ from weekdays; still review potential flexible loads "
                        "if a peak is predicted."
                    ),
                    reason="Calendar feature indicates a weekend interval in the October 2016 replay.",
                    evidence="Calendar is_weekend from the replay timestamp; rule-based overlay.",
                )
            )

        return recs

    @staticmethod
    def _overall_priority(recs: List[Recommendation]) -> str:
        if not recs:
            return "none"
        order = {"high": 3, "medium": 2, "low": 1, "none": 0}
        return max(recs, key=lambda r: order.get(r.priority, 0)).priority


recommendation_service = RecommendationEngine()
