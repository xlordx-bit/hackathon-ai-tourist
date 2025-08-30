from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime
import logging
import joblib
import os
from src.common.errors import with_error_handling, ValidationError, DatabaseError
from src.common.database.connection import get_mongo_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

class LocationData(BaseModel):
    user_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timestamp: str  # Accept ISO format string
    speed: Optional[float] = Field(None, ge=0)
    accuracy: Optional[float] = Field(None, ge=0)
    battery_level: Optional[int] = Field(None, ge=0, le=100)

    def get_datetime(self) -> datetime:
        return datetime.fromisoformat(self.timestamp.replace('Z', '+00:00'))

    model_config = {
        'json_schema_extra': {
            'example': {
                'user_id': 'test_user_1',
                'latitude': 12.9716,
                'longitude': 77.5946,
                'timestamp': '2025-08-30T00:00:00Z',
                'speed': 5.0,
                'accuracy': 10.0,
                'battery_level': 85
            }
        }
    }

class AnomalyDetectionResult(BaseModel):
    is_anomaly: bool
    confidence: float
    details: Dict[str, float]
    timestamp: datetime = Field(default_factory=datetime.now)

class AnomalyDetector:
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path or "models/anomaly_detector.joblib"
        self.load_model()

    def load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info("Loaded existing model")
            else:
                self.model = IsolationForest(
                    contamination=0.1,
                    random_state=42,
                    n_estimators=100
                )
                logger.info("Created new model")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise DatabaseError("Failed to load anomaly detection model")

    def save_model(self):
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            logger.info("Model saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise DatabaseError("Failed to save anomaly detection model")

    def train(self, data: List[LocationData]):
        if not data:
            raise ValidationError("No training data provided")

        try:
            features = self._extract_features(data)
            self.model.fit(features)
            self.save_model()
        except Exception as e:
            logger.error(f"Training error: {str(e)}")
            raise DatabaseError("Failed to train model")

    def detect_anomaly(self, data: LocationData) -> AnomalyDetectionResult:
        try:
            features = self._extract_features([data])
            score = self.model.score_samples(features)[0]
            threshold = -0.5  # Adjustable threshold
            is_anomaly = score < threshold
            
            confidence = 1 - (1 / (1 + np.exp(-score)))  # Convert score to probability
            
            return AnomalyDetectionResult(
                is_anomaly=is_anomaly,
                confidence=float(confidence),
                details={
                    "anomaly_score": float(score),
                    "threshold": threshold
                }
            )
        except Exception as e:
            logger.error(f"Detection error: {str(e)}")
            raise DatabaseError("Failed to detect anomaly")

    def _extract_features(self, data: List[LocationData]) -> np.ndarray:
        features = []
        for point in data:
            feature_vector = [
                point.latitude,
                point.longitude,
                point.speed if point.speed is not None else 0,
                point.accuracy if point.accuracy is not None else 0
            ]
            features.append(feature_vector)
        return np.array(features)

# Initialize detector
detector = AnomalyDetector()

async def get_detector():
    return detector

@app.post("/train")
async def train_model(
    data: List[LocationData],
    background_tasks: BackgroundTasks,
    detector: AnomalyDetector = Depends(get_detector)
):
    try:
        background_tasks.add_task(detector.train, data)
        return {"message": "Model training started"}
    except ValidationError as e:
        logger.error(f"Validation error in training: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect")
async def detect_anomaly(
    data: LocationData,
    detector: AnomalyDetector = Depends(get_detector)
) -> AnomalyDetectionResult:
    try:
        result = detector.detect_anomaly(data)
        
        # Store result in MongoDB for analysis
        db = get_mongo_database()
        await db.anomaly_detections.insert_one({
            "user_id": data.user_id,
            "location": {
                "type": "Point",
                "coordinates": [data.longitude, data.latitude]
            },
            "timestamp": data.get_datetime(),
            "result": result.dict(),
            "metadata": {
                "speed": data.speed,
                "accuracy": data.accuracy,
                "battery_level": data.battery_level
            }
        })
        
        return result
    except ValidationError as e:
        logger.error(f"Validation error in detection: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}
