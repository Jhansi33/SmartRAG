from fastapi import APIRouter, Depends, status
from app.database.connection import get_db
from app.services.auth_service import AuthService
from app.services.rag_service import RAGService
from app.models.chat import ChatQuestionRequest, ChatAnswerResponse, ChatHistoryResponse

router = APIRouter(prefix="/chatbot", tags=["Chatbot & RAG Engine"])

@router.post("/ask", response_model=ChatAnswerResponse)
async def ask_question(
    payload: ChatQuestionRequest,
    current_user: dict = Depends(AuthService.get_current_user),
    db = Depends(get_db)
):
    """Ask a question to the RAG chatbot base. Answers using uploaded documents and logs performance."""
    user_id = str(current_user["_id"])
    result = await RAGService.ask_chatbot(
        user_id=user_id,
        question=payload.question,
        limit=payload.historyLimit,
        db=db
    )
    return result

@router.get("/history", response_model=list[ChatHistoryResponse])
async def get_chat_history(
    current_user: dict = Depends(AuthService.get_current_user),
    db = Depends(get_db)
):
    """Get conversation history for the current logged-in user."""
    user_id = str(current_user["_id"])
    history = []
    # Fetch user chat history sorted chronologically descending
    async for chat in db.chat_history.find({"userId": user_id}).sort("timestamp", -1).limit(50):
        chat["_id"] = str(chat["_id"])
        # Format sources correctly matching ChatHistoryResponse
        sources = []
        for src in chat.get("retrievedSources", []):
            sources.append({
                "filename": src.get("filename", "unknown"),
                "score": float(src.get("score", 0.0)),
                "snippet": src.get("snippet", "")
            })
        chat["retrievedSources"] = sources
        history.append(chat)
    return history
