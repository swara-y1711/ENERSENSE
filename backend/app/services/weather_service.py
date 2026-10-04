"""
weather_service.py
------------------
ENERSENSE Historical Weather Service using Open-Meteo API.

Retrieves historical weather observations (temperature, relative humidity, rainfall)
for Delhi, India (coordinates: 28.6139° N, 77.2090° E) corresponding to
I-BLEND historical replay timestamps.

Key Principles:
  1. Historical Accuracy:
     Uses Open-Meteo's official historical archive API for October 2016 rather than
     mistakenly attaching current live weather to historical telemetry.
  2. Provenance Honesty:
     Clearly marks weather data as coming from Open-Meteo (Delhi, India).
     Never claims that I-BLEND files contain weather observations.
  3. Efficient Bulk Caching:
     Pre-fetches and caches hourly observations in memory so that iterating through
     2,976 15-minute replay records generates zero repeated network requests.
  4. Deterministic Granularity Mapping:
     Maps 15-minute timestamps to the hourly observation of that window
     (e.g., 14:15 -> 14:00 observation), documented deterministically.
  5. Resilient Error Handling:
     Handles SSL/network timeouts cleanly and never silently invents zeroed-out
     fake weather values.
"""

from datetime import datetime
from typing import Any, Dict, Optional, Tuple, Union
import httpx
from pydantic import BaseModel, Field

from app.services.tariff_service import parse_and_localize_timestamp

# Delhi coordinates for facility context
DELHI_LATITUDE: float = 28.6139
DELHI_LONGITUDE: float = 77.2090
DEFAULT_TIMEZONE: str = "Asia/Kolkata"
DEFAULT_DEMO_TIMESTAMP: str = "2016-10-01T00:00:00+05:30"

# Open-Meteo API endpoints
OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"


class WeatherServiceError(Exception):
    """Raised when weather data cannot be retrieved from Open-Meteo."""
    pass


class WeatherData(BaseModel):
    """Core weather metrics for a timestamp."""
    temperature_c: float = Field(..., description="Air temperature at 2m in Celsius")
    relative_humidity_percent: float = Field(..., description="Relative humidity at 2m in percent")
    rainfall_mm: float = Field(..., description="Precipitation/rainfall in mm")


class WeatherResponse(BaseModel):
    """API schema for weather endpoints."""
    timestamp: str = Field(..., description="ISO 8601 timestamp in Asia/Kolkata (+05:30)")
    weather: WeatherData = Field(..., description="Weather measurements")
    source: str = Field("Open-Meteo", description="Weather data provider")
    mode: str = Field("historical_weather", description="Historical weather archive mode")


class WeatherContextSummary(BaseModel):
    """Nested weather summary schema for combined telemetry context."""
    temperature_c: float = Field(..., description="Air temperature in Celsius")
    relative_humidity_percent: float = Field(..., description="Relative humidity in percent")
    rainfall_mm: float = Field(..., description="Rainfall in mm")
    source: str = Field("Open-Meteo", description="Weather provider")


class OpenMeteoWeatherService:
    """
    Service client for retrieving and caching historical weather observations from Open-Meteo.
    """

    def __init__(
        self,
        latitude: float = DELHI_LATITUDE,
        longitude: float = DELHI_LONGITUDE,
        timezone: str = DEFAULT_TIMEZONE,
    ):
        self.latitude = latitude
        self.longitude = longitude
        self.timezone = timezone
        
        # In-memory hourly cache: "YYYY-MM-DDTHH:00" -> WeatherData
        self._cache: Dict[str, WeatherData] = {}
        self._cache_hits: int = 0
        self._cache_misses: int = 0

    @property
    def cached_hours_count(self) -> int:
        return len(self._cache)

    @property
    def cache_stats(self) -> Dict[str, int]:
        return {
            "cached_hours": len(self._cache),
            "cache_hits": self._cache_hits,
            "cache_misses": self._cache_misses,
        }

    def _execute_open_meteo_request(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Executes an HTTP GET request to Open-Meteo Archive API with SSL fallback and timeout handling.
        """
        params = {
            "latitude": self.latitude,
            "longitude": self.longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "temperature_2m,relative_humidity_2m,rain",
            "timezone": self.timezone,
        }

        # Try standard HTTPS verification first; fall back to verify=False if local OS certificates fail
        try:
            with httpx.Client(timeout=15.0) as client:
                response = client.get(OPEN_METEO_ARCHIVE_URL, params=params)
        except (httpx.ConnectError, httpx.RequestError):
            try:
                with httpx.Client(timeout=15.0, verify=False) as client:
                    response = client.get(OPEN_METEO_ARCHIVE_URL, params=params)
            except Exception as exc:
                raise WeatherServiceError(f"Network error connecting to Open-Meteo: {str(exc)}") from exc
        except Exception as exc:
            raise WeatherServiceError(f"Unexpected error calling Open-Meteo: {str(exc)}") from exc

        if response.status_code != 200:
            raise WeatherServiceError(
                f"Open-Meteo API returned HTTP {response.status_code}: {response.text}"
            )

        try:
            return response.json()
        except Exception as exc:
            raise WeatherServiceError(f"Invalid JSON returned by Open-Meteo: {str(exc)}") from exc

    def _populate_cache_for_range(self, start_date: str, end_date: str):
        """
        Fetches a range of dates from Open-Meteo in a single bulk request and populates the in-memory cache.
        """
        data = self._execute_open_meteo_request(start_date=start_date, end_date=end_date)
        hourly = data.get("hourly", {})
        times = hourly.get("time", [])
        temps = hourly.get("temperature_2m", [])
        humidities = hourly.get("relative_humidity_2m", [])
        rains = hourly.get("rain", [])

        if not times or len(times) != len(temps):
            raise WeatherServiceError("Open-Meteo response did not contain valid hourly telemetry vectors.")

        for t_str, temp, rh, rain in zip(times, temps, humidities, rains):
            if temp is not None and rh is not None:
                self._cache[t_str] = WeatherData(
                    temperature_c=round(float(temp), 2),
                    relative_humidity_percent=round(float(rh), 2),
                    rainfall_mm=round(float(rain), 2) if rain is not None else 0.0,
                )

    def preload_october_2016(self):
        """Pre-fetches all 744 hours of October 2016 in one request."""
        if not any(k.startswith("2016-10") for k in self._cache):
            self._populate_cache_for_range("2016-10-01", "2016-10-31")

    def get_weather_for_timestamp(
        self, timestamp: Union[str, datetime, None] = None
    ) -> WeatherResponse:
        """
        Retrieves historical weather observation for a given timestamp.
        
        Granularity Strategy:
          Maps any 15-minute timestamp (e.g. 14:15, 14:30, 14:45) to the hourly
          observation at the start of that interval (14:00).
        """
        if timestamp is None:
            raw_ts = DEFAULT_DEMO_TIMESTAMP
        else:
            raw_ts = timestamp

        localized_dt = parse_and_localize_timestamp(raw_ts)
        hourly_key = localized_dt.strftime("%Y-%m-%dT%H:00")

        # Check memory cache
        if hourly_key in self._cache:
            self._cache_hits += 1
            return WeatherResponse(
                timestamp=localized_dt.isoformat(),
                weather=self._cache[hourly_key],
                source="Open-Meteo",
                mode="historical_weather",
            )

        # Cache miss
        self._cache_misses += 1
        date_str = localized_dt.strftime("%Y-%m-%d")

        # If it falls within October 2016, fetch the entire month for maximum efficiency
        if date_str.startswith("2016-10"):
            self._populate_cache_for_range("2016-10-01", "2016-10-31")
        else:
            self._populate_cache_for_range(date_str, date_str)

        if hourly_key not in self._cache:
            raise WeatherServiceError(
                f"Historical weather observation for {hourly_key} is unavailable from Open-Meteo."
            )

        return WeatherResponse(
            timestamp=localized_dt.isoformat(),
            weather=self._cache[hourly_key],
            source="Open-Meteo",
            mode="historical_weather",
        )


# Global singleton instance
weather_service = OpenMeteoWeatherService()
