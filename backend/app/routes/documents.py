from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from app.database.connection import get_db
from app.services.auth_service import AuthService
from app.services.document_service import DocumentService
from app.models.document import DocumentResponse

router = APIRouter(prefix="/documents", tags=["Document Management"])

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(AuthService.get_current_admin),
    db = Depends(get_db)
):
    """Admin only: Upload a document (.pdf, .docx, .txt), extract, chunk, embed, and store."""
    filename = file.filename
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '.{ext}'. Supported extensions are .pdf, .docx, .txt"
        )
        
    try:
        content = await file.read()
        doc = await DocumentService.upload_document(filename, content, db)
        return doc
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and embed document: {str(e)}"
        )

@router.get("/", response_model=list[DocumentResponse])
async def list_files(
    current_user: dict = Depends(AuthService.get_current_user),
    db = Depends(get_db)
):
    """Get list of all uploaded documents."""
    docs = await DocumentService.list_documents(db)
    return docs

@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
async def delete_file(
    doc_id: str,
    current_user: dict = Depends(AuthService.get_current_admin),
    db = Depends(get_db)
):
    """Admin only: Remove a document and clear its vector index representation."""
    success = await DocumentService.delete_document(doc_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or delete failed"
        )
    return {"message": "Document successfully deleted and vector store updated"}
