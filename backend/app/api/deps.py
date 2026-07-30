from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.database.engine import get_db_session
from app.core.security import verify_token
from app.core.exceptions import UnauthorizedException
from app.repositories.user import UserRepository
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_db_session)
) -> User:
    token = credentials.credentials
    user_id_str = verify_token(token, token_type="access")
    
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id_str)
    
    if not user:
        raise UnauthorizedException("User not found")
    if not user.is_active:
        raise UnauthorizedException("Inactive user")
        
    return user
