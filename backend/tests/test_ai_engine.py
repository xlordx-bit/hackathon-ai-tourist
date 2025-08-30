import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timezone

def test_train_model(ai_client: TestClient, test_location_data):
    """Test model training endpoint"""
    response = ai_client.post(
        "/train",
        json=[test_location_data]
    )
    print("Response:", response.status_code)
    print("Response body:", response.json())  # Print validation error details
    assert response.status_code == 200
    assert "message" in response.json()
    assert response.json()["message"] == "Model training started"

def test_detect_anomaly(ai_client: TestClient, test_location_data):
    """Test anomaly detection endpoint"""
    # First train the model with some data
    train_data = [test_location_data] * 10  # Create multiple similar points
    response = ai_client.post("/train", json=train_data)
    assert response.status_code == 200

    # Now test detection
    response = ai_client.post(
        "/detect",
        json=test_location_data
    )
    assert response.status_code == 200
    result = response.json()
    
    # Check response structure
    assert "is_anomaly" in result
    assert "confidence" in result
    assert "details" in result
    assert "timestamp" in result
    
    # Check value types and ranges
    assert isinstance(result["is_anomaly"], bool)
    assert isinstance(result["confidence"], float)
    assert isinstance(result["details"], dict)
    assert 0 <= result["confidence"] <= 1
    
    # Check details
    assert "anomaly_score" in result["details"]
    assert "threshold" in result["details"]
    assert isinstance(result["details"]["anomaly_score"], float)
    assert isinstance(result["details"]["threshold"], float)

def test_detect_anomaly_invalid_coordinates(ai_client: TestClient, test_location_data):
    """Test anomaly detection with invalid coordinates"""
    invalid_data = test_location_data.copy()
    invalid_data["latitude"] = 100  # Invalid latitude
    
    response = ai_client.post(
        "/detect",
        json=invalid_data
    )
    assert response.status_code == 422  # Validation error

def test_health_check(ai_client: TestClient):
    """Test health check endpoint"""
    response = ai_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()
