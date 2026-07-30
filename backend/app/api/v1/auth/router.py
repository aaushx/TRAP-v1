from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.database.engine import get_db_session
from app.schemas.auth import LoginRequest, AuthResponse, RefreshRequest, Token
from app.schemas.user import UserCreate, UserResponse
from app.services.auth import AuthService
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=dict[str, AuthResponse])
async def register(
    user_in: UserCreate, 
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    auth_service = AuthService(session)
    result = await auth_service.register(user_in)
    return {"data": result}

@router.post("/login", response_model=dict[str, AuthResponse])
async def login(
    login_req: LoginRequest, 
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    auth_service = AuthService(session)
    result = await auth_service.login(login_req)
    return {"data": result}

@router.post("/refresh", response_model=dict[str, Token])
async def refresh_token(
    refresh_req: RefreshRequest, 
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    auth_service = AuthService(session)
    result = await auth_service.refresh(refresh_req.refresh_token)
    return {"data": result}

@router.get("/me", response_model=dict[str, UserResponse])
async def get_me(
    current_user: User = Depends(get_current_user)
) -> Any:
    return {"data": current_user}
