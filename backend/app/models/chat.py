from datetime import datetime
from typing import List, Optional, Annotated
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class SourceSnippet(BaseModel):
    filename: str
    score: float
    snippet: str

class ChatQuestionRequest(BaseModel):
    question: str
    historyLimit: Optional[int] = 10

class ChatAnswerResponse(BaseModel):
    answer: str
    sources: List[SourceSnippet]
    suggestedQuestions: Optional[List[str]] = None

class ChatHistoryCreate(BaseModel):
    userId: str
    question: str
    response: str
    retrievedSources: List[dict]

class ChatHistoryResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    userId: str
    question: str
    response: str
    retrievedSources: List[SourceSnippet]
    timestamp: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
class ChatHistoryItem(BaseModel):
    id: PyObjectId = Field(alias="_id")
    question: str
    response: str
    timestamp: datetime
    
    class Config:
        populate_by_name = True
