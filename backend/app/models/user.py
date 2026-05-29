from datetime import datetime
from typing import Optional, Annotated
from pydantic import BaseModel, EmailStr, Field, BeforeValidator

# Represent MongoDB ObjectId as a string in Pydantic v2
PyObjectId = Annotated[str, BeforeValidator(str)]

class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    role: str = Field(default="user", pattern="^(user|admin)$")

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: PyObjectId = Field(alias="_id")
    createdAt: datetime

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
