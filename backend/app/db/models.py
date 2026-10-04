from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.db.database import Base


class Building(Base):
    __tablename__ = "buildings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    source = Column(String(100), default="I-BLEND")
    timezone = Column(String(50), default="Asia/Kolkata")
    created_at = Column(DateTime, default=datetime.utcnow)

    telemetry_records = relationship("Telemetry", back_populates="building", cascade="all, delete-orphan")
    weather_records = relationship("WeatherContext", back_populates="building", cascade="all, delete-orphan")
    forecast_records = relationship("Forecast", back_populates="building", cascade="all, delete-orphan")
    impact_simulations = relationship("ImpactSimulation", back_populates="building", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "source": self.source,
            "timezone": self.timezone,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Telemetry(Base):
    __tablename__ = "telemetry"
    __table_args__ = (
        UniqueConstraint("building_id", "timestamp", name="uq_telemetry_building_ts"),
        Index("idx_telemetry_building_ts", "building_id", "timestamp"),
    )

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False, index=True)
    demand_kw = Column(Float, nullable=False)
    source = Column(String(50), default="I-BLEND")
    created_at = Column(DateTime, default=datetime.utcnow)

    building = relationship("Building", back_populates="telemetry_records")

    def to_dict(self):
        return {
            "id": self.id,
            "building_id": self.building_id,
            "timestamp": self.timestamp,
            "demand_kw": self.demand_kw,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class WeatherContext(Base):
    __tablename__ = "weather_context"
    __table_args__ = (
        UniqueConstraint("building_id", "timestamp", name="uq_weather_building_ts"),
        Index("idx_weather_building_ts", "building_id", "timestamp"),
    )

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False, index=True)
    temperature_c = Column(Float, nullable=True)
    relative_humidity_percent = Column(Float, nullable=True)
    rainfall_mm = Column(Float, nullable=True)
    source = Column(String(50), default="Open-Meteo")
    created_at = Column(DateTime, default=datetime.utcnow)

    building = relationship("Building", back_populates="weather_records")

    def to_dict(self):
        return {
            "id": self.id,
            "building_id": self.building_id,
            "timestamp": self.timestamp,
            "temperature_c": self.temperature_c,
            "relative_humidity_percent": self.relative_humidity_percent,
            "rainfall_mm": self.rainfall_mm,
            "source": self.source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Forecast(Base):
    __tablename__ = "forecasts"
    __table_args__ = (
        UniqueConstraint("building_id", "timestamp", name="uq_forecast_building_ts"),
        Index("idx_forecast_building_ts", "building_id", "timestamp"),
    )

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False, index=True)
    timestamp = Column(String(50), nullable=False, index=True)
    predicted_demand_kw = Column(Float, nullable=False)
    model_name = Column(String(100), default="XGBoost")
    mode = Column(String(50), default="historical_backtest")
    created_at = Column(DateTime, default=datetime.utcnow)

    building = relationship("Building", back_populates="forecast_records")

    def to_dict(self):
        return {
            "id": self.id,
            "building_id": self.building_id,
            "timestamp": self.timestamp,
            "predicted_demand_kw": self.predicted_demand_kw,
            "model_name": self.model_name,
            "mode": self.mode,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ImpactSimulation(Base):
    __tablename__ = "impact_simulations"

    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"), nullable=False, index=True)
    start_timestamp = Column(String(50), nullable=False)
    end_timestamp = Column(String(50), nullable=False)
    requested_reduction_kw = Column(Float, nullable=False)
    total_simulated_reduction_kwh = Column(Float, nullable=False)
    average_simulated_reduction_kw = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    building = relationship("Building", back_populates="impact_simulations")

    def to_dict(self):
        return {
            "id": self.id,
            "building_id": self.building_id,
            "start_timestamp": self.start_timestamp,
            "end_timestamp": self.end_timestamp,
            "requested_reduction_kw": self.requested_reduction_kw,
            "total_simulated_reduction_kwh": self.total_simulated_reduction_kwh,
            "average_simulated_reduction_kw": self.average_simulated_reduction_kw,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
