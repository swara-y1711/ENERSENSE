"""Regression checks that Stage 1–4 APIs still work after Stage 5."""

from tests.conftest import BELOW_PEAK_TS, PREDICTED_PEAK_TS


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_tariff_current_endpoint(client):
    response = client.get("/api/tariff/current", params={"timestamp": BELOW_PEAK_TS})
    assert response.status_code == 200
    body = response.json()
    assert body["period"] == "off_peak"
    assert body["applicable_rate"] is None


def test_replay_status_and_current(client):
    status = client.get("/api/replay/status")
    assert status.status_code == 200
    assert status.json()["total_records"] == 2976

    current = client.get("/api/replay/current", params={"timestamp": BELOW_PEAK_TS})
    assert current.status_code == 200
    body = current.json()
    assert body["source"] == "I-BLEND"
    assert body["tariff"]["period"] == "off_peak"


def test_forecast_status_and_current(client):
    status = client.get("/api/forecast/status")
    assert status.status_code == 200
    body = status.json()
    assert body["model_available"] is True
    assert body["mode"] == "historical_backtest"

    current = client.get("/api/forecast/current", params={"timestamp": PREDICTED_PEAK_TS})
    assert current.status_code == 200
    forecast = current.json()
    assert forecast["predicted_demand_kw"] > 0
    assert forecast["mode"] == "historical_backtest"


def test_peak_current_and_expected(client):
    current = client.get("/api/peak/current", params={"timestamp": PREDICTED_PEAK_TS})
    assert current.status_code == 200
    peak = current.json()
    assert peak["peak_status"] == "predicted_peak"
    assert peak["is_predicted_peak"] is True

    below = client.get("/api/peak/current", params={"timestamp": BELOW_PEAK_TS})
    assert below.status_code == 200
    assert below.json()["peak_status"] == "below_peak"

    expected = client.get(
        "/api/peak/expected",
        params={"start_timestamp": PREDICTED_PEAK_TS, "window_hours": 2.0},
    )
    assert expected.status_code == 200
    assert expected.json()["window_intervals_count"] == 8


def test_flexibility_current_and_simulate(client):
    current = client.get("/api/flexibility/current", params={"timestamp": PREDICTED_PEAK_TS})
    assert current.status_code == 200
    flex = current.json()
    assert flex["potential_flexible_kw"] >= 0
    assert "not guaranteed" in flex["notice"].lower()

    simulate = client.post(
        "/api/flexibility/simulate",
        json={
            "start_time": "2016-10-03T11:00:00+05:30",
            "end_time": "2016-10-03T12:00:00+05:30",
            "requested_reduction_kw": 5.0,
        },
    )
    assert simulate.status_code == 200
    sim = simulate.json()
    assert sim["mode"] == "historical_what_if_simulation"
    assert "does not send" in sim["notice"].lower()
