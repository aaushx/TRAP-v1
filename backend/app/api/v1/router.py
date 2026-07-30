from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.dashboard.router import router as dashboard_router
from app.api.v1.users.router import router as users_router
from app.api.v1.problems.router import router as problems_router
from app.api.v1.companies.router import router as companies_router
from app.api.v1.goals.router import router as goals_router
from app.api.v1.search.router import router as search_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(problems_router, prefix="/problems", tags=["Problems"])
api_router.include_router(companies_router, prefix="/companies", tags=["Companies"])
api_router.include_router(goals_router, prefix="/goals", tags=["Goals"])
api_router.include_router(search_router, prefix="/search", tags=["Search"])
