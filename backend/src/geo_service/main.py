from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import numpy as np
from shapely.geometry import Point, Polygon

app = FastAPI()

class GeoFence(BaseModel):
    id: str
    name: str
    coordinates: List[List[float]]  # List of [lat, lon] points
    risk_level: str
    description: Optional[str] = None
    created_at: datetime = datetime.now()

class Location(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: Optional[float] = None

class GeoFenceService:
    def __init__(self):
        self.fences: List[GeoFence] = []
        
    def add_fence(self, fence: GeoFence) -> None:
        self.fences.append(fence)
        
    def remove_fence(self, fence_id: str) -> None:
        self.fences = [f for f in self.fences if f.id != fence_id]
        
    def check_location(self, location: Location) -> List[GeoFence]:
        point = Point(location.latitude, location.longitude)
        intersecting_fences = []
        
        for fence in self.fences:
            polygon = Polygon(fence.coordinates)
            if polygon.contains(point):
                intersecting_fences.append(fence)
                
        return intersecting_fences

service = GeoFenceService()

@app.post("/fence")
async def create_fence(fence: GeoFence):
    try:
        service.add_fence(fence)
        return {"message": "Fence created successfully", "fence_id": fence.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/fence/{fence_id}")
async def delete_fence(fence_id: str):
    try:
        service.remove_fence(fence_id)
        return {"message": "Fence removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check")
async def check_location(location: Location):
    try:
        intersecting_fences = service.check_location(location)
        return {
            "in_fences": [
                {
                    "fence_id": fence.id,
                    "name": fence.name,
                    "risk_level": fence.risk_level
                }
                for fence in intersecting_fences
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
