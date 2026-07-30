from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import LoginRequest, AuthResponse, Token
from app.schemas.user import UserCreate
from app.repositories.user import UserRepository
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
from app.core.exceptions import UnauthorizedException, BadRequestException, ConflictException

class AuthService:
    def __init__(self, session: AsyncSession):
        self.user_repo = UserRepository(session)

    async def register(self, user_in: UserCreate) -> AuthResponse:
        existing_user = await self.user_repo.get_by_email(user_in.email)
        if existing_user:
            raise ConflictException("User with this email already exists")

        hashed_password = get_password_hash(user_in.password)
        user = await self.user_repo.create(user_in, hashed_password)

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        return AuthResponse(
            user=user,
            tokens=Token(access_token=access_token, refresh_token=refresh_token)
        )

    async def login(self, login_req: LoginRequest) -> AuthResponse:
        user = await self.user_repo.get_by_email(login_req.email)
        if not user or not user.hashed_password:
            raise UnauthorizedException("Invalid email or password")
        
        if not verify_password(login_req.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")
            
        if not user.is_active:
            raise UnauthorizedException("Account is disabled")

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))

        return AuthResponse(
            user=user,
            tokens=Token(access_token=access_token, refresh_token=refresh_token)
        )

    async def refresh(self, refresh_token: str) -> Token:
        user_id_str = verify_token(refresh_token, token_type="refresh")
        user = await self.user_repo.get_by_id(user_id_str)
        
        if not user or not user.is_active:
            raise UnauthorizedException("Invalid refresh token or inactive user")

        access_token = create_access_token(subject=str(user.id))
        new_refresh_token = create_refresh_token(subject=str(user.id))

        return Token(access_token=access_token, refresh_token=new_refresh_token)
