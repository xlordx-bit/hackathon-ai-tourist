# Common test fixtures and utilities for all services
import pytest
from fastapi.testclient import TestClient
from typing import Generator
import os
import sys
import asyncio
from datetime import datetime, timezone

# Add src directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import your FastAPI applications
from ai_engine.main import app as ai_app
from geo_service.main import app as geo_app
from alert_system.main import app as alert_app

@pytest.fixture
def ai_client() -> Generator:
    with TestClient(ai_app) as client:
        yield client

@pytest.fixture
def geo_client() -> Generator:
    with TestClient(geo_app) as client:
        yield client

@pytest.fixture
def alert_client() -> Generator:
    with TestClient(alert_app) as client:
        yield client

@pytest.fixture
def test_location_data():
    return {
        "user_id": "test_user_1",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        "speed": 5.0,
        "accuracy": 10.0,
        "battery_level": 85
    }

@pytest.fixture
def test_geofence_data():
    return {
        "id": "test_fence_1",
        "name": "Test Zone",
        "coordinates": [
            [12.9716, 77.5946],
            [12.9717, 77.5947],
            [12.9718, 77.5948],
            [12.9716, 77.5946]
        ],
        "risk_level": "medium",
        "description": "Test geofence zone"
    }

@pytest.fixture
def test_alert_data():
    return {
        "id": "test_alert_1",
        "user_id": "test_user_1",
        "alert_type": "panic",
        "severity": "high",
        "location": {
            "latitude": 12.9716,
            "longitude": 77.5946
        },
        "description": "Test panic alert"
    }

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()
