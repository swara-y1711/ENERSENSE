import logging
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.models import Building, Telemetry, WeatherContext, Forecast, ImpactSimulation
from app.db.database import init_db, SessionLocal

logger = logging.getLogger(__name__)


def get_or_create_building(
    db: Session,
    name: str = "Academic Building",
    source: str = "I-BLEND",
    timezone: str = "Asia/Kolkata",
) -> Building:
    """Find existing building record or create a new demo building."""
    building = db.query(Building).filter(Building.name == name).first()
    if building:
        return building

    building = Building(name=name, source=source, timezone=timezone)
    db.add(building)
    try:
        db.commit()
        db.refresh(building)
        logger.info(f"Created new building record: {name} (ID: {building.id})")
    except IntegrityError:
        db.rollback()
        building = db.query(Building).filter(Building.name == name).first()
    return building


def persist_telemetry_batch(
    db: Session,
    building_id: int,
    records: List[Dict[str, Any]],
) -> Tuple[int, int]:
    """
    Persist telemetry records idempotently.
    Returns (inserted_count, skipped_count).
    """
    if not records:
        return 0, 0

    # Fetch existing timestamps for this building
    existing_ts = set(
        ts[0] for ts in db.query(Telemetry.timestamp).filter(Telemetry.building_id == building_id).all()
    )

    inserted = 0
    skipped = 0

    for rec in records:
        ts = rec.get("timestamp")
        if not ts:
            continue

        if ts in existing_ts:
            skipped += 1
            continue

        item = Telemetry(
            building_id=building_id,
            timestamp=ts,
            demand_kw=float(rec.get("demand_kw", 0.0)),
            source=rec.get("source", "I-BLEND"),
        )
        db.add(item)
        existing_ts.add(ts)
        inserted += 1

    if inserted > 0:
        db.commit()

    return inserted, skipped


def persist_weather_batch(
    db: Session,
    building_id: int,
    records: List[Dict[str, Any]],
) -> Tuple[int, int]:
    """
    Persist weather context records idempotently.
    Returns (inserted_count, skipped_count).
    """
    if not records:
        return 0, 0

    existing_ts = set(
        ts[0] for ts in db.query(WeatherContext.timestamp).filter(WeatherContext.building_id == building_id).all()
    )

    inserted = 0
    skipped = 0

    for rec in records:
        ts = rec.get("timestamp")
        if not ts:
            continue

        if ts in existing_ts:
            skipped += 1
            continue

        item = WeatherContext(
            building_id=building_id,
            timestamp=ts,
            temperature_c=rec.get("temperature_c"),
            relative_humidity_percent=rec.get("relative_humidity_percent"),
            rainfall_mm=rec.get("rainfall_mm"),
            source=rec.get("source", "Open-Meteo"),
        )
        db.add(item)
        existing_ts.add(ts)
        inserted += 1

    if inserted > 0:
        db.commit()

    return inserted, skipped


def persist_forecast_batch(
    db: Session,
    building_id: int,
    records: List[Dict[str, Any]],
) -> Tuple[int, int]:
    """
    Persist forecast records idempotently.
    Returns (inserted_count, skipped_count).
    """
    if not records:
        return 0, 0

    existing_ts = set(
        ts[0] for ts in db.query(Forecast.timestamp).filter(Forecast.building_id == building_id).all()
    )

    inserted = 0
    skipped = 0

    for rec in records:
        ts = rec.get("timestamp")
        if not ts:
            continue

        if ts in existing_ts:
            skipped += 1
            continue

        item = Forecast(
            building_id=building_id,
            timestamp=ts,
            predicted_demand_kw=float(rec.get("predicted_demand_kw", 0.0)),
            model_name=rec.get("model_name", "XGBoost"),
            mode=rec.get("mode", "historical_backtest"),
        )
        db.add(item)
        existing_ts.add(ts)
        inserted += 1

    if inserted > 0:
        db.commit()

    return inserted, skipped


def persist_impact_simulation(
    db: Session,
    building_id: int,
    sim_data: Dict[str, Any],
) -> ImpactSimulation:
    """Persist an impact simulation summary record."""
    sim = ImpactSimulation(
        building_id=building_id,
        start_timestamp=sim_data["start_timestamp"],
        end_timestamp=sim_data["end_timestamp"],
        requested_reduction_kw=float(sim_data.get("requested_reduction_kw", 0.0)),
        total_simulated_reduction_kwh=float(sim_data.get("total_simulated_reduction_kwh", 0.0)),
        average_simulated_reduction_kw=float(sim_data.get("average_simulated_reduction_kw", 0.0)),
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)
    return sim


def get_db_status(db: Session) -> Dict[str, Any]:
    """
    Query database connection and basic table row counts for /api/db/status.
    """
    try:
        init_db()
        b_count = db.query(Building).count()
        t_count = db.query(Telemetry).count()
        w_count = db.query(WeatherContext).count()
        f_count = db.query(Forecast).count()
        i_count = db.query(ImpactSimulation).count()

        return {
            "database": "connected",
            "table_availability": {
                "buildings": True,
                "telemetry": True,
                "weather_context": True,
                "forecasts": True,
                "impact_simulations": True,
            },
            "row_counts": {
                "buildings": b_count,
                "telemetry": t_count,
                "weather_context": w_count,
                "forecasts": f_count,
                "impact_simulations": i_count,
            },
        }
    except Exception as e:
        logger.error(f"Error querying db status: {e}")
        return {
            "database": "error",
            "error": str(e),
            "table_availability": {
                "buildings": False,
                "telemetry": False,
                "weather_context": False,
                "forecasts": False,
                "impact_simulations": False,
            },
            "row_counts": {
                "buildings": 0,
                "telemetry": 0,
                "weather_context": 0,
                "forecasts": 0,
                "impact_simulations": 0,
            },
        }


def get_demo_building(db: Session) -> Optional[Dict[str, Any]]:
    """Fetch the default demo building record."""
    building = db.query(Building).first()
    return building.to_dict() if building else None
