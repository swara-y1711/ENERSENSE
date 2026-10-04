"""
test_db_persistence.py
----------------------
Stage 8 Supabase / PostgreSQL Persistence tests for ENERSENSE.
Verifies database initialization, idempotent seeding logic, impact simulation persistence,
and /api/db/status & /api/db/building API endpoints using isolated test sessions.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, init_db
from app.db.models import Building, Telemetry, WeatherContext, Forecast, ImpactSimulation
from app.services.persistence_service import (
    get_or_create_building,
    persist_telemetry_batch,
    persist_weather_batch,
    persist_forecast_batch,
    persist_impact_simulation,
    get_db_status,
    get_demo_building,
)

# Test SQLite in-memory engine for fast, isolated tests
TEST_DB_URL = "sqlite:///:memory:"


@pytest.fixture
def test_db():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


def test_database_initialization(test_db):
    """Verifies that init_db executes cleanly without errors."""
    success = init_db()
    assert success is True


def test_building_creation_and_find(test_db):
    """Verifies building creation and idempotent lookup."""
    b1 = get_or_create_building(test_db, name="Academic Building", source="I-BLEND")
    assert b1.id is not None
    assert b1.name == "Academic Building"

    # Second call should return the exact same building without duplicate error
    b2 = get_or_create_building(test_db, name="Academic Building", source="I-BLEND")
    assert b2.id == b1.id


def test_telemetry_persistence_and_idempotency(test_db):
    """Verifies batch telemetry insertion and duplicate timestamp skipping."""
    building = get_or_create_building(test_db, name="Test Block")

    batch = [
        {"timestamp": "2016-10-01T00:00:00+05:30", "demand_kw": 24.5, "source": "I-BLEND"},
        {"timestamp": "2016-10-01T00:15:00+05:30", "demand_kw": 26.1, "source": "I-BLEND"},
    ]

    inserted, skipped = persist_telemetry_batch(test_db, building.id, batch)
    assert inserted == 2
    assert skipped == 0

    # Re-persisting the same batch should result in 0 inserted and 2 skipped
    inserted_again, skipped_again = persist_telemetry_batch(test_db, building.id, batch)
    assert inserted_again == 0
    assert skipped_again == 2

    records = test_db.query(Telemetry).filter(Telemetry.building_id == building.id).all()
    assert len(records) == 2


def test_weather_persistence_and_idempotency(test_db):
    """Verifies weather context batch insertion and idempotency."""
    building = get_or_create_building(test_db, name="Test Block Weather")

    batch = [
        {
            "timestamp": "2016-10-01T00:00:00+05:30",
            "temperature_c": 28.5,
            "relative_humidity_percent": 65.0,
            "rainfall_mm": 0.0,
            "source": "Open-Meteo",
        }
    ]

    ins1, skip1 = persist_weather_batch(test_db, building.id, batch)
    assert ins1 == 1
    assert skip1 == 0

    ins2, skip2 = persist_weather_batch(test_db, building.id, batch)
    assert ins2 == 0
    assert skip2 == 1


def test_forecast_persistence_and_idempotency(test_db):
    """Verifies forecast batch insertion and idempotency."""
    building = get_or_create_building(test_db, name="Test Block Forecast")

    batch = [
        {
            "timestamp": "2016-10-01T00:00:00+05:30",
            "predicted_demand_kw": 25.8,
            "model_name": "XGBoost",
            "mode": "historical_backtest",
        }
    ]

    ins1, skip1 = persist_forecast_batch(test_db, building.id, batch)
    assert ins1 == 1
    assert skip1 == 0

    ins2, skip2 = persist_forecast_batch(test_db, building.id, batch)
    assert ins2 == 0
    assert skip2 == 1


def test_impact_simulation_persistence(test_db):
    """Verifies persistence of explicit impact simulation summaries."""
    building = get_or_create_building(test_db, name="Sim Block")

    sim_data = {
        "start_timestamp": "2016-10-03T11:00:00+05:30",
        "end_timestamp": "2016-10-03T13:00:00+05:30",
        "requested_reduction_kw": 15.0,
        "total_simulated_reduction_kwh": 7.5,
        "average_simulated_reduction_kw": 15.0,
    }

    sim = persist_impact_simulation(test_db, building.id, sim_data)
    assert sim.id is not None
    assert sim.requested_reduction_kw == 15.0
    assert sim.total_simulated_reduction_kwh == 7.5

    records = test_db.query(ImpactSimulation).all()
    assert len(records) == 1


def test_db_status_service(test_db):
    """Verifies get_db_status response formatting."""
    get_or_create_building(test_db, name="Academic Building")
    status_dict = get_db_status(test_db)

    assert status_dict["database"] == "connected"
    assert "row_counts" in status_dict
    assert status_dict["table_availability"]["buildings"] is True
    assert status_dict["row_counts"]["buildings"] >= 1


def test_api_db_status_and_building(client):
    """Verifies FastAPI GET /api/db/status and GET /api/db/building endpoints."""
    res_status = client.get("/api/db/status")
    assert res_status.status_code == 200
    body_status = res_status.json()
    assert body_status["database"] == "connected"
    assert "row_counts" in body_status

    res_b = client.get("/api/db/building")
    assert res_b.status_code == 200
    body_b = res_b.json()
    assert "name" in body_b
    assert body_b["name"] == "Academic Building"


def test_impact_simulate_endpoint_persists_summary(client):
    """Verifies that calling POST /api/impact/simulate persists a summary record."""
    payload = {
        "start_timestamp": "2016-10-03T11:00:00+05:30",
        "end_timestamp": "2016-10-03T13:00:00+05:30",
        "requested_reduction_kw": 10.0,
    }

    resp = client.post("/api/impact/simulate", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["requested_reduction_kw"] == 10.0

    # Verify status reflects incremented impact_simulations count
    db_status = client.get("/api/db/status").json()
    assert db_status["row_counts"]["impact_simulations"] >= 1
