import asyncio
import asyncpg
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

async def init_postgres():
    """Initialize PostgreSQL database with required extensions and schemas"""
    try:
        # Connect to PostgreSQL
        conn = await asyncpg.connect(
            user=os.getenv('POSTGRES_USER', 'postgres'),
            password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
            database=os.getenv('POSTGRES_DB', 'tourist_safety'),
            host=os.getenv('POSTGRES_HOST', 'localhost'),
            port=int(os.getenv('POSTGRES_PORT', 5432))
        )

        # Read schema file
        schema_path = os.path.join(
            os.path.dirname(__file__),
            'common',
            'database',
            'schema.sql'
        )
        with open(schema_path, 'r') as f:
            schema_sql = f.read()

        # Execute schema creation
        await conn.execute(schema_sql)
        logger.info("PostgreSQL schema created successfully")

        await conn.close()
    except Exception as e:
        logger.error(f"Error initializing PostgreSQL: {str(e)}")
        raise

async def init_mongodb():
    """Initialize MongoDB with required collections and indexes"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017'))
        db = client['tourist_safety']

        # Create collections
        await db.create_collection('users')
        await db.create_collection('anomaly_detections')
        await db.create_collection('alerts')
        await db.create_collection('audit_logs')

        # Create indexes
        await db.users.create_index('email', unique=True)
        await db.anomaly_detections.create_index([('location', '2dsphere')])
        await db.anomaly_detections.create_index('timestamp')
        await db.alerts.create_index([('location', '2dsphere')])
        await db.alerts.create_index('timestamp')
        await db.audit_logs.create_index('timestamp')

        logger.info("MongoDB collections and indexes created successfully")
    except Exception as e:
        logger.error(f"Error initializing MongoDB: {str(e)}")
        raise

async def main():
    """Initialize all databases"""
    try:
        await init_postgres()
        await init_mongodb()
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
