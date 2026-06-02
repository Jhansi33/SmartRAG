import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.connection import MongoDB
from app.routes import auth, documents, chatbot, tags, feedback, analytics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Domain-Specific RAG Chatbot & Content Tagging API",
    description="Production-ready FastAPI backend for semantic document retrieval, automatic tagging, and feedback-based QA search.",
    version="1.0.0"
)

# Enable CORS for React Frontend Integration
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup & Shutdown lifecycle hooks
@app.on_event("startup")
async def startup_db_client():
    await MongoDB.connect()

    if MongoDB.db is not None:
        # Load the vector store index and metadata from MongoDB snapshot
        from app.vectorstore.store import vector_store
        await vector_store.load_from_db(MongoDB.db)

        # Pre-load SentenceTransformer model in a background thread to prevent first-query request lag
        import threading
        threading.Thread(target=vector_store.get_encoder, daemon=True).start()
    else:
        logger.warning("MongoDB is not connected. API health endpoints will stay online, but authenticated app routes will return 503.")
    
    logger.info("Application Startup Sequence Complete.")

@app.on_event("shutdown")
async def shutdown_db_client():
    await MongoDB.disconnect()
    logger.info("Application Shutdown Sequence Complete.")

# Register API Routers under /api namespace
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/", tags=["Health Check"])
async def root_health_check():
    """Root health check to confirm server status."""
    return {
        "status": "healthy",
        "service": "Domain-Specific RAG Chatbot API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/healthz", tags=["Health Check"])
async def health_check():
    """Lightweight health check for Render and deployment diagnostics."""
    return {
        "status": "healthy",
        "databaseConnected": MongoDB.db is not None,
        "service": "Domain-Specific RAG Chatbot API"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
