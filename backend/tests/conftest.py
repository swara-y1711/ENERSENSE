"""Shared fixtures for ENERSENSE backend tests."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


BELOW_PEAK_TS = "2016-10-01T03:00:00+05:30"
PREDICTED_PEAK_TS = "2016-10-03T11:15:00+05:30"
PEAK_WINDOW_START_TS = "2016-10-03T10:00:00+05:30"
