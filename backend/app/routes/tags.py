from fastapi import APIRouter, Depends
from app.services.auth_service import AuthService
from app.services.tagger_service import TaggerService
from app.models.feedback import TagGenerateRequest, TagGenerateResponse

router = APIRouter(prefix="", tags=["Content Tagging Module"])

@router.post("/generate-tags", response_model=TagGenerateResponse)
async def generate_content_tags(
    payload: TagGenerateRequest,
    current_user: dict = Depends(AuthService.get_current_user)
):
    """Analyze Question and Answer submission and generate 4-8 technical content tags."""
    tags = await TaggerService.generate_tags(payload.question, payload.answer)
    return {"tags": tags}
