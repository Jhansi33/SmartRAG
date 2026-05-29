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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup & Shutdown lifecycle hooks
@app.on_event("startup")
async def startup_db_client():
    await MongoDB.connect()
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

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
