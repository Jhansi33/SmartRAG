from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class EvaluationBase(BaseModel):
    retrievalAccuracy: float = Field(..., ge=0.0, le=1.0)
    precisionAtK: float = Field(..., ge=0.0, le=1.0)
    recallAtK: float = Field(..., ge=0.0, le=1.0)
    answerRelevance: float = Field(..., ge=0.0, le=1.0)
    responseQuality: float = Field(..., ge=0.0, le=10.0) # 0 to 10 scale

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationResponse(EvaluationBase):
    id: PyObjectId = Field(alias="_id")
    createdAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
