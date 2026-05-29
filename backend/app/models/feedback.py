from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class FeedbackQABase(BaseModel):
    question: str = Field(..., min_length=5)
    answer: str = Field(..., min_length=5)
    tags: str = Field(..., description="Comma-separated tags")

class FeedbackQACreate(FeedbackQABase):
    pass

class FeedbackQAUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    tags: Optional[str] = None

class FeedbackQAResponse(FeedbackQABase):
    id: PyObjectId = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class FeedbackSearchRequest(BaseModel):
    question: str

class FeedbackSearchResponse(BaseModel):
    answer: str
    sources: Optional[List[dict]] = None
    matchType: str = "database" # 'database' or 'synthesized' or 'default'

class TagGenerateRequest(BaseModel):
    question: str
    answer: str

class TagGenerateResponse(BaseModel):
    tags: str
