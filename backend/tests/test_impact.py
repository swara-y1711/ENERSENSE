"""
test_impact.py
--------------
Stage 6 Impact Verification & Baseline Comparison tests.
"""

import json
import pytest

from tests.conftest import BELOW_PEAK_TS, PEAK_WINDOW_START_TS, PREDICTED_PEAK_TS

CONTROL_PHRASES = (
    "turn off",
    "switch off",
    "stop ev charger",
    "stop ev",
    "shut down",
    "dispatch command",
    "automatically control",
)
MONEY_MARKERS = ("₹", "inr/", "savings", "energy_cost", "rupee")


def _dump(payload) -> str:
    return json.dumps(payload, ensure_ascii=False).lower()


def test_current_impact_endpoint(client):
    response = client.get("/api/impact/current", params={"timestamp": PREDICTED_PEAK_TS})
    assert response.status_code == 200
    body = response.json()

    assert body["timestamp"] == PREDICTED_PEAK_TS
    assert "actual_demand_kw" in body
    assert "baseline_demand_kw" in body
    assert "scenario_demand_kw" in body
    assert body["interval_duration_hours"] == 0.25
    assert body["mode"] == "historical_backtest"
    assert body["baseline_method"] == "historical_slot_median"


def test_baseline_comparison(client):
    response = client.get("/api/impact/current", params={"timestamp": PREDICTED_PEAK_TS})
    body = response.json()

    actual = body["actual_demand_kw"]
    baseline = body["baseline_demand_kw"]
    diff = round(actual - baseline, 4)

    assert body["baseline_difference_kw"] == diff


def test_scenario_flexibility_cap_and_kwh_calculation(client):
    # Fetch flexibility at PREDICTED_PEAK_TS (where flexibility is ~15.35 kW)
    flex_resp = client.get("/api/flexibility/current", params={"timestamp": PREDICTED_PEAK_TS})
    potential_flex = flex_resp.json()["potential_flexible_kw"]
    assert potential_flex > 0.0

    # Request reduction of 200.0 kW (much higher than potential flex)
    response = client.get(
        "/api/impact/current",
        params={"timestamp": PREDICTED_PEAK_TS, "requested_reduction_kw": 200.0},
    )
    assert response.status_code == 200
    body = response.json()

    # Applied reduction must be capped by potential flexibility
    assert body["applied_simulated_reduction_kw"] == potential_flex
    # Energy impact must be 15-min interval (applied * 0.25), not 1-hour
    expected_kwh = round(potential_flex * 0.25, 4)
    assert body["estimated_energy_impact_kwh"] == expected_kwh
    assert body["estimated_energy_impact_kwh"] != potential_flex


def test_requested_reduction_cap(client):
    # Fetch flexibility at PREDICTED_PEAK_TS
    flex_resp = client.get("/api/flexibility/current", params={"timestamp": PREDICTED_PEAK_TS})
    potential_flex = flex_resp.json()["potential_flexible_kw"]
    assert potential_flex > 5.0

    # Request a smaller reduction of 5.0 kW
    response = client.get(
        "/api/impact/current",
        params={"timestamp": PREDICTED_PEAK_TS, "requested_reduction_kw": 5.0},
    )
    body = response.json()

    # Applied reduction should be capped by requested reduction (5.0 kW)
    assert body["applied_simulated_reduction_kw"] == 5.0
    assert body["estimated_energy_impact_kwh"] == round(5.0 * 0.25, 4)


def test_zero_and_negative_reduction_protection(client):
    # Request 0.0 kW reduction
    resp_zero = client.get(
        "/api/impact/current",
        params={"timestamp": PREDICTED_PEAK_TS, "requested_reduction_kw": 0.0},
    )
    body_zero = resp_zero.json()
    assert body_zero["applied_simulated_reduction_kw"] == 0.0
    assert body_zero["estimated_energy_impact_kwh"] == 0.0
    assert body_zero["scenario_demand_kw"] == body_zero["actual_demand_kw"]

    # Request negative reduction (-10.0 kW)
    resp_neg = client.get(
        "/api/impact/current",
        params={"timestamp": PREDICTED_PEAK_TS, "requested_reduction_kw": -10.0},
    )
    body_neg = resp_neg.json()
    assert body_neg["applied_simulated_reduction_kw"] == 0.0
    assert body_neg["estimated_energy_impact_kwh"] == 0.0
    assert body_neg["scenario_demand_kw"] == body_neg["actual_demand_kw"]


def test_simulate_endpoint_multi_interval_aggregation(client):
    end_ts = "2016-10-03T13:00:00+05:30"
    payload = {
        "start_timestamp": PEAK_WINDOW_START_TS,
        "end_timestamp": end_ts,
        "requested_reduction_kw": 10.0,
    }

    response = client.post("/api/impact/simulate", json=payload)
    assert response.status_code == 200
    body = response.json()

    assert body["requested_reduction_kw"] == 10.0
    assert body["total_intervals"] > 0
    assert body["interval_count"] == body["total_intervals"]
    assert "fully_achievable_intervals" in body
    assert "achievable_percentage" in body
    assert "total_simulated_reduction_kwh" in body
    assert "average_actual_demand_kw" in body
    assert "average_baseline_demand_kw" in body
    assert "average_scenario_demand_kw" in body

    # Verify sum of interval kWh matches total_simulated_reduction_kwh
    sum_kwh = round(sum(i["interval_energy_impact_kwh"] for i in body["intervals"]), 4)
    assert body["total_simulated_reduction_kwh"] == sum_kwh


def test_no_fake_rupee_savings_and_no_control_claims(client):
    current = client.get("/api/impact/current", params={"timestamp": PREDICTED_PEAK_TS}).json()
    simulate = client.post(
        "/api/impact/simulate",
        json={
            "start_timestamp": PEAK_WINDOW_START_TS,
            "end_timestamp": "2016-10-03T13:00:00+05:30",
            "requested_reduction_kw": 15.0,
        },
    ).json()

    blob = _dump([current, simulate])

    for marker in MONEY_MARKERS:
        assert marker not in blob

    for phrase in CONTROL_PHRASES:
        assert phrase not in blob

    assert "simulated" in current["notice"].lower()
    assert "scenario" in current["notice"].lower()
