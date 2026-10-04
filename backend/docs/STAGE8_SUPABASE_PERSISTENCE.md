# ENERSENSE Stage 8: Supabase PostgreSQL Persistence Architecture

## 1. Overview & Purpose

Stage 8 integrates a clean PostgreSQL database persistence layer backed by **Supabase** (with automatic SQLite fallback for local development and zero-dependency unit testing).

The purpose of this persistence layer is to provide:
- Persistent application storage for building metadata, historical replay telemetry, historical Open-Meteo weather context, XGBoost forecast results, and user-initiated impact scenario simulations.
- Status and health introspection endpoints (`/api/db/status`, `/api/db/building`, `/api/health/db`).
- An idempotent demo seed mechanism (`python scripts/seed_supabase_demo.py`).

---

## 2. Why the Full I-BLEND Dataset is NOT Stored in Supabase

The raw I-BLEND archive contains multi-gigabyte raw 1-minute to 15-minute smart-meter readings across dozens of Indian campus buildings.

**ENERSENSE Architectural Design Choice**:
- The **I-BLEND replay engine** ([`app/services/replay_service.py`](file:///c:/Users/DELL/Desktop/CODE/hackathon/ENERSENSE/backend/app/services/replay_service.py)) remains the stream provider of historical building telemetry.
- The **Supabase database** stores only the **curated October 2016 demo replay window** (2,976 records) needed for demonstration, forecast alignment, weather context, and saved simulation summaries.
- This prevents bloating Supabase storage with millions of raw unindexed records while keeping database operations fast, deterministic, and cost-effective.

---

## 3. Database Schema & Tables

The schema uses SQLAlchemy models ([`app/db/models.py`](file:///c:/Users/DELL/Desktop/CODE/hackathon/ENERSENSE/backend/app/db/models.py)) mapped to standard PostgreSQL / Supabase tables:

```mermaid
erDiagram
    BUILDINGS ||--o{ TELEMETRY : "has"
    BUILDINGS ||--o{ WEATHER_CONTEXT : "has"
    BUILDINGS ||--o{ FORECASTS : "has"
    BUILDINGS ||--o{ IMPACT_SIMULATIONS : "has"

    BUILDINGS {
        int id PK
        string name UK
        string source
        string timezone
        datetime created_at
    }

    TELEMETRY {
        int id PK
        int building_id FK
        string timestamp
        float demand_kw
        string source
        datetime created_at
    }

    WEATHER_CONTEXT {
        int id PK
        int building_id FK
        string timestamp
        float temperature_c
        float relative_humidity_percent
        float rainfall_mm
        string source
        datetime created_at
    }

    FORECASTS {
        int id PK
        int building_id FK
        string timestamp
        float predicted_demand_kw
        string model_name
        string mode
        datetime created_at
    }

    IMPACT_SIMULATIONS {
        int id PK
        int building_id FK
        string start_timestamp
        string end_timestamp
        float requested_reduction_kw
        float total_simulated_reduction_kwh
        float average_simulated_reduction_kw
        datetime created_at
    }
```

### Table Details

1. **`buildings`**:
   - `id` (Integer, Primary Key)
   - `name` (String, Unique, e.g. `"Academic Building"`)
   - `source` (String, e.g. `"I-BLEND"`)
   - `timezone` (String, e.g. `"Asia/Kolkata"`)
   - `created_at` (DateTime)

2. **`telemetry`**:
   - `id` (Integer, Primary Key)
   - `building_id` (Integer, Foreign Key to `buildings.id`)
   - `timestamp` (String, ISO 8601, e.g. `"2016-10-01T00:00:00+05:30"`)
   - `demand_kw` (Float)
   - `source` (String, default `"I-BLEND"`)
   - `created_at` (DateTime)
   - *Constraint*: `UniqueConstraint("building_id", "timestamp")`

3. **`weather_context`**:
   - `id` (Integer, Primary Key)
   - `building_id` (Integer, Foreign Key to `buildings.id`)
   - `timestamp` (String, ISO 8601)
   - `temperature_c` (Float)
   - `relative_humidity_percent` (Float)
   - `rainfall_mm` (Float)
   - `source` (String, default `"Open-Meteo"`)
   - `created_at` (DateTime)
   - *Constraint*: `UniqueConstraint("building_id", "timestamp")`

4. **`forecasts`**:
   - `id` (Integer, Primary Key)
   - `building_id` (Integer, Foreign Key to `buildings.id`)
   - `timestamp` (String, ISO 8601)
   - `predicted_demand_kw` (Float)
   - `model_name` (String, default `"XGBoost"`)
   - `mode` (String, default `"historical_backtest"`)
   - `created_at` (DateTime)
   - *Constraint*: `UniqueConstraint("building_id", "timestamp")`

5. **`impact_simulations`**:
   - `id` (Integer, Primary Key)
   - `building_id` (Integer, Foreign Key to `buildings.id`)
   - `start_timestamp` (String, ISO 8601)
   - `end_timestamp` (String, ISO 8601)
   - `requested_reduction_kw` (Float)
   - `total_simulated_reduction_kwh` (Float)
   - `average_simulated_reduction_kw` (Float)
   - `created_at` (DateTime)

---

## 4. Environment Configuration

The application reads credentials from environment variables (`.env`):

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://dtfolqspukwukhgwoqoc.supabase.co
SUPABASE_KEY=sb_secret_xxx
```

- If `DATABASE_URL` is set, SQLAlchemy connects to PostgreSQL / Supabase.
- If `DATABASE_URL` is omitted, the system defaults to local SQLite (`sqlite:///./enersense.db`) for instant local development and offline unit tests.
- `.env` files are ignored by Git.

---

## 5. Seed Script & Idempotency

To populate the database with the October 2016 demo dataset:

```powershell
python scripts/seed_supabase_demo.py
```

### How Seed Idempotency Works:
- `get_or_create_building()` checks if `"Academic Building"` already exists.
- `persist_telemetry_batch()`, `persist_weather_batch()`, and `persist_forecast_batch()` query existing `(building_id, timestamp)` tuples prior to insertion.
- Existing rows are skipped; only missing rows are inserted.
- Re-running the script prints `0 inserted | 2976 existing/skipped`.

---

## 6. Impact Simulation Persistence

When a user executes a multi-interval what-if simulation via `POST /api/impact/simulate`:
- The simulation result is returned to the caller immediately.
- The simulation summary (`start_timestamp`, `end_timestamp`, `requested_reduction_kw`, `total_simulated_reduction_kwh`, `average_simulated_reduction_kw`) is automatically persisted to the `impact_simulations` table.
- Standard read/GET endpoints do not write to the database.

---

## 7. API Introspection Endpoints

- **`GET /api/db/status`**:
  Returns connection status, table availability, and row counts across all 5 tables:
  ```json
  {
    "database": "connected",
    "table_availability": {
      "buildings": true,
      "telemetry": true,
      "weather_context": true,
      "forecasts": true,
      "impact_simulations": true
    },
    "row_counts": {
      "buildings": 1,
      "telemetry": 2976,
      "weather_context": 2976,
      "forecasts": 2976,
      "impact_simulations": 1
    }
  }
  ```

- **`GET /api/db/building`**:
  Returns the active demo building record.

- **`GET /api/health/db`**:
  Verifies database connection health via Supabase client or SQLAlchemy session.

---

## 8. Historical Replay vs. Future Live Ingestion

| Aspect | Historical Replay (Current MVP) | Future Live Smart-Meter Ingestion |
| :--- | :--- | :--- |
| **Telemetry Stream** | Sequentially replayed from I-BLEND October 2016 CSV. | Ingested via MQTT / Modbus / HTTP Webhooks into Supabase. |
| **Database Role** | Stores curated demo window, forecast results, & simulation logs. | Acts as transactional telemetry store and timeseries cache. |
| **Weather Integration** | Pre-fetched historical Open-Meteo archive for October 2016. | Polled hourly from Open-Meteo current forecast API. |
