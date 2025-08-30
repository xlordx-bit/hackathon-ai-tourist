from typing import Dict, Any
import os
import json
from dotenv import load_dotenv

class Config:
    """Configuration manager for the application"""
    
    def __init__(self):
        load_dotenv()
        self._config = {
            'environment': os.getenv('NODE_ENV', 'development'),
            'services': {
                'ai_engine': {
                    'host': os.getenv('AI_SERVICE_HOST', 'localhost'),
                    'port': int(os.getenv('AI_SERVICE_PORT', 5000)),
                    'model_path': os.getenv('AI_MODEL_PATH', 'models/anomaly_detector.joblib'),
                    'training': {
                        'batch_size': int(os.getenv('AI_TRAINING_BATCH_SIZE', 1000)),
                        'contamination': float(os.getenv('AI_CONTAMINATION', 0.1))
                    }
                },
                'geo_service': {
                    'host': os.getenv('GEO_SERVICE_HOST', 'localhost'),
                    'port': int(os.getenv('GEO_SERVICE_PORT', 5001))
                },
                'alert_system': {
                    'host': os.getenv('ALERT_SERVICE_HOST', 'localhost'),
                    'port': int(os.getenv('ALERT_SERVICE_PORT', 5002)),
                    'notification': {
                        'sms_enabled': os.getenv('ENABLE_SMS', 'false').lower() == 'true',
                        'email_enabled': os.getenv('ENABLE_EMAIL', 'true').lower() == 'true'
                    }
                }
            },
            'database': {
                'postgres': {
                    'host': os.getenv('POSTGRES_HOST', 'localhost'),
                    'port': int(os.getenv('POSTGRES_PORT', 5432)),
                    'database': os.getenv('POSTGRES_DB', 'tourist_safety'),
                    'user': os.getenv('POSTGRES_USER', 'postgres'),
                    'password': os.getenv('POSTGRES_PASSWORD', 'postgres')
                },
                'mongodb': {
                    'uri': os.getenv('MONGODB_URI', 'mongodb://localhost:27017'),
                    'database': os.getenv('MONGODB_DATABASE', 'tourist_safety')
                },
                'redis': {
                    'host': os.getenv('REDIS_HOST', 'localhost'),
                    'port': int(os.getenv('REDIS_PORT', 6379)),
                    'db': int(os.getenv('REDIS_DB', 0))
                }
            },
            'jwt': {
                'secret': os.getenv('JWT_SECRET', 'your-secret-key'),
                'expires_in': int(os.getenv('JWT_EXPIRES_IN', 86400))
            },
            'mqtt': {
                'broker_url': os.getenv('MQTT_BROKER_URL', 'mqtt://localhost:1883'),
                'username': os.getenv('MQTT_USERNAME', ''),
                'password': os.getenv('MQTT_PASSWORD', '')
            },
            'logging': {
                'level': os.getenv('LOG_LEVEL', 'info').upper(),
                'file': os.getenv('LOG_FILE', 'app.log')
            }
        }
    
    def get(self, key: str, default: Any = None) -> Any:
        """
        Get a configuration value using dot notation
        
        Example:
            config.get('database.postgres.host')
        """
        try:
            value = self._config
            for k in key.split('.'):
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key: str, value: Any):
        """Set a configuration value using dot notation"""
        keys = key.split('.')
        current = self._config
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        current[keys[-1]] = value
    
    def is_development(self) -> bool:
        """Check if running in development environment"""
        return self.get('environment') == 'development'
    
    def is_production(self) -> bool:
        """Check if running in production environment"""
        return self.get('environment') == 'production'
    
    def to_dict(self) -> Dict[str, Any]:
        """Get the entire configuration as a dictionary"""
        return self._config.copy()
    
    def save_to_file(self, filepath: str):
        """Save the configuration to a JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self._config, f, indent=2)
    
    @classmethod
    def load_from_file(cls, filepath: str) -> 'Config':
        """Load configuration from a JSON file"""
        instance = cls()
        with open(filepath, 'r') as f:
            instance._config.update(json.load(f))
        return instance

# Create a singleton instance
config = Config()
