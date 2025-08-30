from datetime import datetime, timezone
from typing import Dict, Any, Optional
import json
import hashlib
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

def timestamp_utc() -> datetime:
    """Get current UTC timestamp"""
    return datetime.now(timezone.utc)

def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_jwt(payload: Dict[str, Any], expires_in: int = 86400) -> str:
    """Generate a JWT token"""
    secret = os.getenv('JWT_SECRET', 'your-secret-key')
    exp = timestamp_utc() + datetime.timedelta(seconds=expires_in)
    payload['exp'] = exp
    return jwt.encode(payload, secret, algorithm='HS256')

def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token"""
    try:
        secret = os.getenv('JWT_SECRET', 'your-secret-key')
        return jwt.decode(token, secret, algorithms=['HS256'])
    except jwt.InvalidTokenError:
        return None

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in kilometers using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return distance

def calculate_speed(
    lat1: float, lon1: float, 
    lat2: float, lon2: float, 
    time1: datetime, time2: datetime
) -> float:
    """Calculate speed between two points in km/h"""
    distance = calculate_distance(lat1, lon1, lat2, lon2)
    time_diff = (time2 - time1).total_seconds() / 3600  # Convert to hours
    
    if time_diff == 0:
        return 0
        
    return distance / time_diff

def is_valid_coordinate(lat: float, lon: float) -> bool:
    """Validate geographic coordinates"""
    return -90 <= lat <= 90 and -180 <= lon <= 180

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)
