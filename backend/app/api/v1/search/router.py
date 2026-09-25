from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Any

from app.database.engine import get_db_session
from app.api.deps import get_current_user
from app.models.user import User
from app.models.problem import Problem
from app.models.company import Company
from app.models.roadmap import Roadmap, RoadmapCategory, RoadmapTopic

router = APIRouter()

@router.get("", include_in_schema=False)
@router.get("/")
async def search_all(
    q: str = Query("", min_length=1),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
) -> Any:
    """Perform instant database searches across Problems, Companies, Goals, and Goal Topics.
    Returns a unified metadata structure containing direct routing URLs and details.
    """
    if not q.strip():
        return {"data": []}

    query_pattern = f"%{q}%"
    results = []

    # 1. Search Problems
    problem_stmt = select(Problem).where(
        Problem.user_id == current_user.id,
        or_(
            Problem.title.ilike(query_pattern),
            Problem.topic.ilike(query_pattern),
            Problem.notes.ilike(query_pattern)
        )
    ).limit(10)
    problem_res = await session.execute(problem_stmt)
    for p in problem_res.scalars().all():
        results.append({
            "type": "problem",
            "id": str(p.id),
            "title": p.title,
            "category": p.topic,
            "description": f"{p.platform.upper()} - {p.difficulty.upper()} ({p.status.upper()})",
            "notes": p.notes,
            "url": "/app/problems"
        })

    # 2. Search Companies
    company_stmt = select(Company).where(
        Company.user_id == current_user.id,
        or_(
            Company.name.ilike(query_pattern),
            Company.role.ilike(query_pattern),
            Company.notes.ilike(query_pattern)
        )
    ).limit(10)
    company_res = await session.execute(company_stmt)
    for c in company_res.scalars().all():
        results.append({
            "type": "company",
            "id": str(c.id),
            "title": c.name,
            "category": c.role,
            "description": f"Status: {c.status.upper()}",
            "notes": c.notes,
            "url": "/app/companies"
        })

    # 3. Search Goals (Roadmaps)
    roadmap_stmt = select(Roadmap).where(
        Roadmap.user_id == current_user.id,
        or_(
            Roadmap.title.ilike(query_pattern),
            Roadmap.description.ilike(query_pattern)
        )
    ).limit(10)
    roadmap_res = await session.execute(roadmap_stmt)
    for r in roadmap_res.scalars().all():
        results.append({
            "type": "goal",
            "id": str(r.id),
            "title": r.title,
            "category": r.target_role,
            "description": r.description or "Goal roadmap",
            "notes": None,
            "url": f"/app/goals/{r.id}"
        })

    # 4. Search Goal Topics (RoadmapTopics)
    topic_stmt = (
        select(RoadmapTopic, RoadmapCategory.roadmap_id)
        .select_from(RoadmapTopic)
        .join(RoadmapCategory, RoadmapTopic.category_id == RoadmapCategory.id)
        .join(Roadmap, RoadmapCategory.roadmap_id == Roadmap.id)
        .where(
            Roadmap.user_id == current_user.id,
            or_(
                RoadmapTopic.name.ilike(query_pattern),
                RoadmapTopic.notes.ilike(query_pattern)
            )
        )
        .limit(10)
    )
    topic_res = await session.execute(topic_stmt)
    for t, roadmap_id in topic_res.all():
        results.append({
            "type": "topic",
            "id": str(t.id),
            "title": t.name,
            "category": "Goal Topic",
            "description": f"Difficulty: {(t.difficulty or 'unknown').upper()} - Est: {t.estimated_hours or 0}h",
            "notes": t.notes,
            "url": f"/app/goals/{roadmap_id}"
        })

    return {"data": results}
