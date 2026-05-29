from datetime import datetime
from typing import Annotated
from pydantic import BaseModel, Field, BeforeValidator

PyObjectId = Annotated[str, BeforeValidator(str)]

class DocumentBase(BaseModel):
    filename: str
    filetype: str
    documentPath: str
    chunksCount: int

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: PyObjectId = Field(alias="_id")
    uploadDate: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}
