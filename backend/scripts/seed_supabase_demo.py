#!/usr/bin/env python3
"""
seed_supabase_demo.py
----------------------
ENERSENSE Stage 8 Supabase / PostgreSQL Seed Script.

Loads historical October 2016 I-BLEND replay telemetry, Open-Meteo weather context,
and XGBoost forecast predictions, persisting them idempotently into the database schema.

Does NOT duplicate rows if executed multiple times.
Does NOT store raw full multi-gigabyte dataset files.
"""

import sys
import logging
from pathlib import Path

# Add backend directory to python path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.database import SessionLocal, init_db
from app.db.models import Building
from app.services.persistence_service import (
    get_or_create_building,
    persist_telemetry_batch,
    persist_weather_batch,
    persist_forecast_batch,
)
from app.services.replay_service import replay_service
from app.services.weather_service import weather_service
from app.services.forecast_service import forecast_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_demo")


def seed_demo_data():
    logger.info("Initializing ENERSENSE database schema...")
    init_db()

    db = SessionLocal()
    try:
        # 1. Create or get primary demo building
        building = get_or_create_building(
            db,
            name="Academic Building",
            source="I-BLEND",
            timezone="Asia/Kolkata",
        )
        logger.info(f"Building ready: '{building.name}' (ID: {building.id})")

        # 2. Extract October 2016 replay records
        records = replay_service._records
        logger.info(f"Loaded {len(records)} I-BLEND replay records for October 2016.")

        # Prepare telemetry batch
        telemetry_batch = [
            {
                "timestamp": r.timestamp,
                "demand_kw": r.demand_kw,
                "source": r.source,
            }
            for r in records
        ]

        tel_inserted, tel_skipped = persist_telemetry_batch(db, building.id, telemetry_batch)
        logger.info(f"Telemetry persistence: {tel_inserted} inserted, {tel_skipped} skipped (already present).")

        # 3. Preload October 2016 weather observations via Open-Meteo integration
        logger.info("Preloading October 2016 historical weather observations...")
        try:
            weather_service.preload_october_2016()
        except Exception as w_err:
            logger.warning(f"Could not preload Open-Meteo weather: {w_err}")

        weather_batch = []
        for r in records:
            try:
                w_resp = weather_service.get_weather_for_timestamp(r.timestamp)
                weather_batch.append({
                    "timestamp": r.timestamp,
                    "temperature_c": w_resp.weather.temperature_c,
                    "relative_humidity_percent": w_resp.weather.relative_humidity_percent,
                    "rainfall_mm": w_resp.weather.rainfall_mm,
                    "source": w_resp.source,
                })
            except Exception:
                continue

        w_inserted, w_skipped = persist_weather_batch(db, building.id, weather_batch)
        logger.info(f"Weather context persistence: {w_inserted} inserted, {w_skipped} skipped.")

        # 4. Generate forecast predictions using Stage 3 XGBoost service
        logger.info("Generating XGBoost forecast predictions for demo window...")
        forecast_batch = []
        for r in records:
            try:
                f_resp = forecast_service.predict_demand(r.timestamp)
                forecast_batch.append({
                    "timestamp": r.timestamp,
                    "predicted_demand_kw": f_resp.predicted_demand_kw,
                    "model_name": f_resp.model,
                    "mode": f_resp.mode,
                })
            except Exception as f_err:
                logger.warning(f"Error predicting demand for {r.timestamp}: {f_err}")
                continue

        f_inserted, f_skipped = persist_forecast_batch(db, building.id, forecast_batch)
        logger.info(f"Forecast persistence: {f_inserted} inserted, {f_skipped} skipped.")

        print("\n" + "=" * 60)
        print(" ENERSENSE STAGE 8 DEMO SEED SUMMARY")
        print("=" * 60)
        print(f" Demo Building    : {building.name} (ID: {building.id})")
        print(f" Telemetry Rows   : {tel_inserted} inserted | {tel_skipped} existing/skipped")
        print(f" Weather Rows     : {w_inserted} inserted | {w_skipped} existing/skipped")
        print(f" Forecast Rows    : {f_inserted} inserted | {f_skipped} existing/skipped")
        print("=" * 60 + "\n")

    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
