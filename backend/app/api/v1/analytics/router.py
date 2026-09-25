"""Analytics API Router for TRAP Placement Preparation Operating System.

Provides endpoints for aggregated performance statistics, topic distributions,
company application funnels, and preparation velocity metrics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.engine import get_db_session
from app.api.deps import get_current_user
from app.models.user import User
from app.services.analytics import AnalyticsService
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    ProblemsAnalytics,
    CompaniesAnalytics,
    GoalsAnalytics,
    ReadinessAnalytics
)

router = APIRouter()


def get_analytics_service(session: AsyncSession = Depends(get_db_session)) -> AnalyticsService:
    """Dependency injection for the AnalyticsService."""
    return AnalyticsService(session=session)


@router.get("", response_model=AnalyticsSummaryResponse, include_in_schema=False)
@router.get("/", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> AnalyticsSummaryResponse:
    """Retrieve full analytics summary including problems, companies, goals, readiness, and trends."""
    return await service.get_user_analytics(current_user.id)


@router.get("/problems", response_model=ProblemsAnalytics)
async def get_problems_analytics(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> ProblemsAnalytics:
    """Retrieve problem solving metrics segmented by difficulty, platform, and topic."""
    analytics = await service.get_user_analytics(current_user.id)
    return analytics.problems


@router.get("/companies", response_model=CompaniesAnalytics)
async def get_companies_analytics(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> CompaniesAnalytics:
    """Retrieve recruitment application pipeline analytics and funnel statistics."""
    analytics = await service.get_user_analytics(current_user.id)
    return analytics.companies


@router.get("/goals", response_model=GoalsAnalytics)
async def get_goals_analytics(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> GoalsAnalytics:
    """Retrieve roadmap goal progress, completion rates, and category coverage."""
    analytics = await service.get_user_analytics(current_user.id)
    return analytics.goals


@router.get("/readiness", response_model=ReadinessAnalytics)
async def get_readiness_analytics(
    current_user: User = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> ReadinessAnalytics:
    """Retrieve placement readiness score, strengths, and study deficiency areas."""
    analytics = await service.get_user_analytics(current_user.id)
    return analytics.readiness
