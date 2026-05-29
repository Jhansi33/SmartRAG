from fastapi import APIRouter, Depends, HTTPException, status
from app.database.connection import get_db
from app.services.auth_service import AuthService
from app.services.feedback_service import FeedbackService
from app.services.tagger_service import TaggerService
from app.models.feedback import (
    FeedbackSearchRequest, FeedbackSearchResponse, 
    FeedbackQACreate, FeedbackQAUpdate, FeedbackQAResponse
)

router = APIRouter(prefix="", tags=["Feedback Database Assistant"])

@router.post("/search-feedback", response_model=FeedbackSearchResponse)
async def search_feedback_qa(
    payload: FeedbackSearchRequest,
    current_user: dict = Depends(AuthService.get_current_user),
    db = Depends(get_db)
):
    """Search feedback QA database using hybrid keyword and semantic similarities."""
    result = await FeedbackService.search_feedback(payload.question, db)
    return result

# Administrative CRUD Operations

@router.get("/feedback-admin", response_model=list[FeedbackQAResponse])
async def list_feedback_entries(
    current_user: dict = Depends(AuthService.get_current_user),
    db = Depends(get_db)
):
    """Get all items in the feedback QA collection."""
    entries = await FeedbackService.list_entries(db)
    return entries

@router.post("/feedback-admin", response_model=FeedbackQAResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback_entry(
    payload: FeedbackQACreate,
    current_admin: dict = Depends(AuthService.get_current_admin),
    db = Depends(get_db)
):
    """Admin only: Create a new feedback Q&A entry. If tags are omitted, auto-generates them."""
    tags = payload.tags.strip()
    # Auto-generate tags if they are empty or equal to "auto"
    if not tags or tags.lower() == "auto":
        tags = await TaggerService.generate_tags(payload.question, payload.answer)
        
    entry = await FeedbackService.add_entry(
        question=payload.question,
        answer=payload.answer,
        tags=tags,
        db=db
    )
    return entry

@router.put("/feedback-admin/{entry_id}", status_code=status.HTTP_200_OK)
async def update_feedback_entry(
    entry_id: str,
    payload: FeedbackQAUpdate,
    current_admin: dict = Depends(AuthService.get_current_admin),
    db = Depends(get_db)
):
    """Admin only: Modify an existing feedback Q&A entry."""
    success = await FeedbackService.update_entry(
        entry_id=entry_id,
        question=payload.question,
        answer=payload.answer,
        tags=payload.tags,
        db=db
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback QA entry not found or modification failed"
        )
    return {"message": "Feedback Q&A entry updated successfully"}

@router.delete("/feedback-admin/{entry_id}", status_code=status.HTTP_200_OK)
async def delete_feedback_entry(
    entry_id: str,
    current_admin: dict = Depends(AuthService.get_current_admin),
    db = Depends(get_db)
):
    """Admin only: Remove a feedback Q&A entry."""
    success = await FeedbackService.delete_entry(entry_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback Q&A entry not found or deletion failed"
        )
    return {"message": "Feedback Q&A entry deleted successfully"}
