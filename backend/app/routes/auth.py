from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from app.database.connection import get_db
from app.models.user import UserRegister, UserLogin, UserResponse, Token
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db = Depends(get_db)):
    """Register a new user in the database."""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already registered"
        )
    
    # Check if this is the first user, make them admin for ease of testing!
    count = await db.users.count_documents({})
    assigned_role = "admin" if count == 0 else user_data.role

    # Hash the password and save the user
    hashed_password = AuthService.hash_password(user_data.password)
    new_user = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hashed_password,
        "role": assigned_role,
        "createdAt": datetime.utcnow()
    }
    
    result = await db.users.insert_one(new_user)
    new_user["_id"] = str(result.inserted_id)
    return new_user

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db = Depends(get_db)):
    """Authenticate a user and return a JWT access token."""
    user = await db.users.find_one({"email": login_data.email})
    if not user or not AuthService.verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate Access Token
    access_token = AuthService.create_access_token(
        data={"sub": user["email"], "role": user["role"]}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(AuthService.get_current_user)):
    """Get the current authenticated user's profile information."""
    return current_user
