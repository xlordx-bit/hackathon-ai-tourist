from typing import Optional
import asyncpg
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from contextlib import asynccontextmanager
import logging
from urllib.parse import quote_plus
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseConnection:
    _postgres_pool: Optional[asyncpg.Pool] = None
    _mongo_client: Optional[AsyncIOMotorClient] = None

    @classmethod
    async def get_postgres_pool(cls) -> asyncpg.Pool:
        if cls._postgres_pool is None:
            try:
                # Create connection pool
                cls._postgres_pool = await asyncpg.create_pool(
                    user=os.getenv('POSTGRES_USER', 'postgres'),
                    password=os.getenv('POSTGRES_PASSWORD', 'postgres'),
                    database=os.getenv('POSTGRES_DB', 'tourist_safety'),
                    host=os.getenv('POSTGRES_HOST', 'localhost'),
                    port=int(os.getenv('POSTGRES_PORT', 5432)),
                    min_size=5,
                    max_size=20
                )
                logger.info("PostgreSQL connection pool created successfully")
            except Exception as e:
                logger.error(f"Failed to create PostgreSQL connection pool: {str(e)}")
                raise

        return cls._postgres_pool

    @classmethod
    def get_mongo_client(cls) -> AsyncIOMotorClient:
        if cls._mongo_client is None:
            try:
                mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
                cls._mongo_client = AsyncIOMotorClient(mongodb_uri)
                # Verify connection
                cls._mongo_client.admin.command('ismaster')
                logger.info("MongoDB connection established successfully")
            except ConnectionFailure as e:
                logger.error(f"Failed to connect to MongoDB: {str(e)}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error connecting to MongoDB: {str(e)}")
                raise

        return cls._mongo_client

    @classmethod
    async def close_connections(cls):
        if cls._postgres_pool:
            await cls._postgres_pool.close()
            cls._postgres_pool = None
            logger.info("PostgreSQL connection pool closed")

        if cls._mongo_client:
            cls._mongo_client.close()
            cls._mongo_client = None
            logger.info("MongoDB connection closed")

@asynccontextmanager
async def get_postgres_connection():
    pool = await DatabaseConnection.get_postgres_pool()
    async with pool.acquire() as connection:
        try:
            yield connection
        except Exception as e:
            logger.error(f"Error in database operation: {str(e)}")
            raise

def get_mongo_database(database_name: str = 'tourist_safety'):
    client = DatabaseConnection.get_mongo_client()
    return client[database_name]
