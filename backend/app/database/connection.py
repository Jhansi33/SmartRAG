import logging
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import TEXT, ASCENDING, DESCENDING
from app.config import settings
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        """Establish asynchronous connection to MongoDB and construct appropriate indexes."""
        if cls.client is not None:
            return
        
        try:
            logger.info(f"Connecting to MongoDB at {settings.MONGODB_URI}...")
            cls.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=10000)
            cls.db = cls.client[settings.DATABASE_NAME]
            await cls.client.admin.command("ping")
            logger.info("MongoDB Connection Successful!")
            
            # Setup Indexes
            await cls._setup_indexes()
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            cls.client = None
            cls.db = None

    @classmethod
    async def disconnect(cls):
        """Disconnect database connection."""
        if cls.client is not None:
            cls.client.close()
            cls.client = None
            cls.db = None
            logger.info("MongoDB Connection Closed.")

    @classmethod
    async def _setup_indexes(cls):
        """Create indexes automatically on application startup to optimize search performance."""
        try:
            # 1. users Collection Index
            await cls.db.users.create_index([("email", ASCENDING)], unique=True)
            logger.info("Unique Index created for users.email")

            # 2. chat_history Collection Indexes
            await cls.db.chat_history.create_index([("userId", ASCENDING)])
            await cls.db.chat_history.create_index([("timestamp", DESCENDING)])
            logger.info("Indexes created for chat_history (userId, timestamp)")

            # 3. feedback_qa Collection Indexes
            # Create a compound Text index on 'question' and 'tags' for keyword matching
            await cls.db.feedback_qa.create_index(
                [("question", TEXT), ("tags", TEXT)],
                name="feedback_qa_text_index"
            )
            # Create separate index on tags for exact category searches
            await cls.db.feedback_qa.create_index([("tags", ASCENDING)])
            logger.info("Text Index and single-field Index created for feedback_qa")

            # 4. evaluations Collection Indexes
            await cls.db.evaluations.create_index([("createdAt", DESCENDING)])
            logger.info("Index created for evaluations.createdAt")

            # 5. documents Collection Indexes
            await cls.db.documents.create_index([("filename", ASCENDING)])
            logger.info("Index created for documents.filename")

        except Exception as e:
            logger.warning(f"Index creation warning: {str(e)}")

def get_db():
    """Dependency helper to retrieve the active MongoDB database."""
    if MongoDB.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is not connected. Check the backend MONGODB_URI environment variable and MongoDB Atlas network access.",
        )
    return MongoDB.db
