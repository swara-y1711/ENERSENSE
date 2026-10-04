"""Stage 5 recommendation engine and API tests."""

import json

from tests.conftest import BELOW_PEAK_TS, PEAK_WINDOW_START_TS, PREDICTED_PEAK_TS

CONTROL_PHRASES = (
    "turn off",
    "switch off",
    "stop ev charger",
    "stop ev",
    "shut down",
    "dispatch",
    "automatically control",
)
MONEY_MARKERS = ("₹", "inr/", "savings", "energy_cost", "rupee")


def _dump(payload) -> str:
    return json.dumps(payload, ensure_ascii=False).lower()


def test_below_peak_produces_no_high_priority_recommendation(client):
    response = client.get("/api/recommendations/current", params={"timestamp": BELOW_PEAK_TS})
    assert response.status_code == 200
    body = response.json()
    assert body["peak_status"] == "below_peak"
    assert body["overall_priority"] == "none"
    assert body["recommendations"] == []
    assert not any(r.get("priority") == "high" for r in body["recommendations"])


def test_predicted_peak_produces_actionable_recommendation(client):
    response = client.get("/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS})
    assert response.status_code == 200
    body = response.json()
    assert body["peak_status"] == "predicted_peak"
    assert body["recommendations"]
    assert body["overall_priority"] == "high"
    actions = " ".join(r["action"] for r in body["recommendations"]).lower()
    assert "consider" in actions
    assert any(r["priority"] == "high" for r in body["recommendations"])


def test_meaningful_potential_flexibility_is_reflected(client):
    flex = client.get("/api/flexibility/current", params={"timestamp": PREDICTED_PEAK_TS})
    assert flex.status_code == 200
    potential = flex.json()["potential_flexible_kw"]

    recs = client.get("/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS})
    body = recs.json()
    assert body["potential_flexible_kw"] == potential
    if potential >= 3.0:
        blob = _dump(body["recommendations"])
        assert "potential flexible" in blob


def test_tariff_context_included_when_available(client):
    peak_body = client.get(
        "/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS}
    ).json()
    assert peak_body["tariff_period"] in ("off_peak", "normal", "peak")
    assert peak_body["recommendations"]
    assert all(r["tariff_period"] for r in peak_body["recommendations"])

    night_tariff = client.get("/api/tariff/current", params={"timestamp": BELOW_PEAK_TS}).json()
    assert night_tariff["period"] == "off_peak"


def test_season_and_weather_context_included_when_available(client):
    body = client.get(
        "/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS}
    ).json()
    assert body["season"] == "post_monsoon"
    weather = body.get("weather_context")
    if weather:
        assert "temperature_c" in weather
        assert weather.get("source") == "Open-Meteo"
        assert all(r.get("weather_context") for r in body["recommendations"])
        assert all(r.get("season") == "post_monsoon" for r in body["recommendations"])


def test_occupant_recommendation_is_simple(client):
    body = client.get(
        "/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS}
    ).json()
    occupant = [r for r in body["recommendations"] if r["audience"] == "occupant"]
    assert occupant
    action = occupant[0]["action"].lower()
    assert "consider" in action
    assert "percentile" not in action
    assert "dispatch" not in action


def test_facility_manager_recommendation_is_operational(client):
    body = client.get(
        "/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS}
    ).json()
    fm = [r for r in body["recommendations"] if r["audience"] == "facility_manager"]
    assert fm
    action = fm[0]["action"].lower()
    assert "facility manager" in action
    assert "review" in action


def test_no_fake_rupee_savings_are_generated(client):
    current = client.get("/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS}).json()
    expected = client.get(
        "/api/recommendations/expected",
        params={"start_timestamp": PEAK_WINDOW_START_TS, "window_hours": 2.0},
    ).json()
    blob = _dump([current, expected])
    for marker in MONEY_MARKERS:
        assert marker not in blob
    assert "energy_cost" not in current
    assert "savings" not in current


def test_no_automatic_control_action_is_generated(client):
    body = client.get(
        "/api/recommendations/current", params={"timestamp": PREDICTED_PEAK_TS}
    ).json()
    blob = _dump(body)
    for phrase in CONTROL_PHRASES:
        assert phrase not in blob
    assert body["notice"].lower().startswith("advisory")
    assert "does not control" in body["notice"].lower()


def test_expected_endpoint_looks_ahead(client):
    response = client.get(
        "/api/recommendations/expected",
        params={"start_timestamp": PEAK_WINDOW_START_TS, "window_hours": 2.0},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["mode"] == "historical_backtest"
    assert body["expected_window"]
    assert body["recommendations"]
    assert body["peak_status"] in ("near_peak", "predicted_peak")
    assert body["upcoming_peak_expected"] is True
