from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.health import router as health_router
from app.api.tariff import router as tariff_router
from app.api.replay import router as replay_router
from app.api.weather import router as weather_router
from app.api.forecast import router as forecast_router
from app.api.peak import router as peak_router
from app.api.flexibility import router as flexibility_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Precision Energy Intelligence API for Facility Managers and Occupants",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration for local Next.js frontend and production URLs
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Health Router under /api
app.include_router(health_router, prefix="/api")

# Also include directly at /health for container/load-balancer standard health checks
app.include_router(health_router)

# Include Time-of-Day Tariff Router under /api
app.include_router(tariff_router, prefix="/api")

# Include Historical Telemetry Replay Router under /api
app.include_router(replay_router, prefix="/api")

# Include Open-Meteo Weather Router under /api
app.include_router(weather_router, prefix="/api")

# Include XGBoost Demand Forecast Router under /api
app.include_router(forecast_router, prefix="/api")

# Include Peak Demand Detection Router under /api
app.include_router(peak_router, prefix="/api")

# Include Flexible Demand Estimation Router under /api
app.include_router(flexibility_router, prefix="/api")


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to ENERSENSE Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health",
        "tariff": "/api/tariff/current",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
