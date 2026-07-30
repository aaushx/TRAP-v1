from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Any

from app.database.engine import get_db_session
from app.schemas.user import UserUpdate, UserResponse, ChangePasswordRequest
from app.repositories.user import UserRepository
from app.api.deps import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.company import Company
from app.models.roadmap import Roadmap, RoadmapCategory, RoadmapTopic
from app.core.security import verify_password, get_password_hash
from app.core.exceptions import UnauthorizedException, BadRequestException

router = APIRouter()

@router.patch("/me", response_model=dict[str, UserResponse])
async def update_me(
    user_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    user_repo = UserRepository(session)
    updated_user = await user_repo.update(current_user, user_in)
    return {"data": updated_user}

@router.post("/me/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    """Verify current password and hash the new password, updating it in the user record."""
    if current_user.hashed_password:
        if not verify_password(data.current_password, current_user.hashed_password):
            raise UnauthorizedException("Incorrect current password")
    
    if len(data.new_password) < 8:
        raise BadRequestException("Password must be at least 8 characters long")
        
    hashed = get_password_hash(data.new_password)
    current_user.hashed_password = hashed
    
    session.add(current_user)
    await session.commit()
    return {"message": "Password changed successfully"}

@router.get("/me/export")
async def export_my_data(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    """Export all user information, goals, tracked companies, and solved problems as a structured JSON download."""
    # 1. Problems
    problems_stmt = select(Problem).where(Problem.user_id == current_user.id)
    problems_res = await session.execute(problems_stmt)
    problems = problems_res.scalars().all()
    
    # 2. Companies
    companies_stmt = select(Company).where(Company.user_id == current_user.id)
    companies_res = await session.execute(companies_stmt)
    companies = companies_res.scalars().all()
    
    # 3. Goals (Roadmaps) + categories + topics
    goals_stmt = select(Roadmap).where(Roadmap.user_id == current_user.id).options(
        selectinload(Roadmap.categories).selectinload(RoadmapCategory.topics)
    )
    goals_res = await session.execute(goals_stmt)
    goals = goals_res.scalars().all()
    
    export_payload = {
        "profile": {
            "email": current_user.email,
            "full_name": current_user.full_name,
            "college": current_user.college,
            "branch": current_user.branch,
            "preferred_language": current_user.preferred_language,
            "target_role": current_user.target_role,
            "grad_year": current_user.grad_year,
            "preferences": current_user.preferences
        },
        "problems": [
            {
                "title": p.title,
                "platform": p.platform,
                "platform_url": p.platform_url,
                "topic": p.topic,
                "difficulty": p.difficulty,
                "status": p.status,
                "notes": p.notes,
                "time_complexity": p.time_complexity,
                "space_complexity": p.space_complexity,
                "created_at": p.created_at.isoformat() if p.created_at else None
            } for p in problems
        ],
        "companies": [
            {
                "name": c.name,
                "role": c.role,
                "status": c.status,
                "applied_date": c.applied_date.isoformat() if c.applied_date else None,
                "interview_date": c.interview_date.isoformat() if c.interview_date else None,
                "job_url": c.job_url,
                "salary_range": c.salary_range,
                "notes": c.notes,
                "created_at": c.created_at.isoformat() if c.created_at else None
            } for c in companies
        ],
        "goals": [
            {
                "title": g.title,
                "description": g.description,
                "target_role": g.target_role,
                "target_companies": g.target_companies,
                "deadline": g.deadline.isoformat() if g.deadline else None,
                "priority": g.priority,
                "status": g.status,
                "categories": [
                    {
                        "name": cat.name,
                        "topics": [
                            {
                                "name": top.name,
                                "status": top.status,
                                "difficulty": top.difficulty,
                                "estimated_hours": top.estimated_hours,
                                "notes": top.notes
                            } for top in cat.topics
                        ]
                    } for cat in g.categories
                ]
            } for g in goals
        ]
    }
    
    return {"data": export_payload}

@router.delete("/me")
async def delete_my_account(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    """Drop the user record from the database. All cascade deletion constraints will automatically clear child entries."""
    await session.delete(current_user)
    await session.commit()
    return {"message": "Account deleted successfully"}
