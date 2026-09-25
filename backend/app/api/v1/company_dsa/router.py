from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.api.deps import get_current_user, get_db_session
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.company_dsa import GoalCompany, DsaCompany
from app.repositories.company_dsa import CompanyDsaRepository
from app.schemas.company_dsa import (
    CompanyDsaListItem,
    CompanyDsaDetail,
    CompanyDsaQuestionItem,
    QuestionDetailResponse,
    PaginatedQuestionsResponse,
    QuestionStatusUpdatePayload,
    CompanyGoalCreatePayload,
    CompanyGoalResponse,
    GoalCompanyItem
)

router = APIRouter()

@router.get("/companies")
async def get_companies(
    search: Optional[str] = Query(None, description="Search companies by name or alias"),
    filter_mode: Optional[str] = Query("all", alias="filter", description="all, most_questions, most_targeted, alphabetical, prepared, not_started"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Return all companies with actual question counts and authenticated user's preparation progress."""
    repo = CompanyDsaRepository(db)
    items = await repo.get_companies_catalog(
        user_id=current_user.id,
        search=search,
        filter_mode=filter_mode
    )
    return {"data": [item.model_dump() for item in items]}


@router.get("/companies/{company_slug}")
async def get_company_detail(
    company_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Return company overview metrics, difficulty breakdown, and topic distribution."""
    repo = CompanyDsaRepository(db)
    company = await repo.get_company_by_slug(company_slug)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company '{company_slug}' not found"
        )

    detail = await repo.get_company_detail(company=company, user_id=current_user.id)
    return {"data": detail.model_dump()}


@router.get("/companies/{company_slug}/questions")
async def get_company_questions(
    company_slug: str,
    topic: Optional[str] = Query(None, description="Filter by topic (e.g. Array, Dynamic Programming)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (Easy, Medium, Hard)"),
    status: Optional[str] = Query(None, description="Filter by user status (not_started, attempted, solved, needs_revision)"),
    time_period: Optional[str] = Query(None, description="Filter by time period (thirty_days, three_months, six_months, more_than_six_months, all_time)"),
    search: Optional[str] = Query(None, description="Search questions by title"),
    sort_by: Optional[str] = Query("frequency", description="Sort by frequency, difficulty, title"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Return paginated, filterable DSA questions for a company with user status."""
    repo = CompanyDsaRepository(db)
    company = await repo.get_company_by_slug(company_slug)
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company '{company_slug}' not found"
        )

    questions = await repo.get_company_questions(
        company_id=company.id,
        user_id=current_user.id,
        topic=topic,
        difficulty=difficulty,
        status=status,
        time_period=time_period,
        search=search,
        sort_by=sort_by,
        page=page,
        page_size=page_size
    )
    return {"data": questions.model_dump()}


@router.get("/questions/{question_id}")
async def get_question_detail(
    question_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Return full canonical question metadata, topics, company occurrences, and authenticated user progress."""
    repo = CompanyDsaRepository(db)
    q = await repo.get_question_by_id(question_id, current_user.id)
    if not q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question '{question_id}' not found"
        )

    status_val, notes_val = await repo.get_question_user_progress(question_id, current_user.id)
    response_data = QuestionDetailResponse(
        id=q.id,
        external_id=q.external_id,
        title=q.title,
        slug=q.slug,
        difficulty=q.difficulty,
        platform_url=q.platform_url,
        topics=q.topics or [],
        frequency=q.frequency,
        acceptance_rate=q.acceptance_rate,
        companies=q.companies or [],
        company_count=q.company_count,
        status=status_val,
        notes=notes_val
    )
    return {"data": response_data.model_dump()}


@router.patch("/questions/{question_id}/status")
@router.patch("/questions/{question_id}/progress")
async def update_question_status(
    question_id: UUID,
    payload: QuestionStatusUpdatePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Update question preparation status for authenticated user with strict multi-tenant isolation."""
    repo = CompanyDsaRepository(db)
    updated = await repo.update_question_status(
        user_id=current_user.id,
        question_id=question_id,
        status=payload.status,
        notes=payload.notes
    )
    return {
        "data": {
            "question_id": str(updated.question_id),
            "status": updated.status,
            "notes": updated.notes,
            "message": "Question status updated successfully"
        }
    }


# ── Company Goals Endpoints ──────────────────────────────────────────
@router.post("/goals/company")
async def create_company_goal(
    payload: CompanyGoalCreatePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Create a company target preparation goal linked to user's roadmap."""
    repo = CompanyDsaRepository(db)
    title = payload.title or f"Target Preparation: {', '.join(payload.company_slugs[:3])}"

    new_roadmap = Roadmap(
        user_id=current_user.id,
        title=title,
        target_role="Software Engineer (DSA)",
        target_companies=payload.company_slugs,
        status="active"
    )
    db.add(new_roadmap)
    await db.flush()

    await repo.sync_goal_companies(new_roadmap.id, payload.company_slugs)
    details = await repo.get_goal_companies(new_roadmap.id, current_user.id)

    total_target = sum(d.question_count for d in details)
    total_solved = sum(d.solved_count for d in details)
    pct = round((total_solved / total_target * 100.0), 1) if total_target > 0 else 0.0

    return {
        "data": {
            "id": str(new_roadmap.id),
            "title": new_roadmap.title,
            "target_role": new_roadmap.target_role,
            "target_companies": new_roadmap.target_companies,
            "company_details": [d.model_dump() for d in details],
            "total_target_questions": total_target,
            "total_solved_questions": total_solved,
            "overall_progress": pct,
            "status": new_roadmap.status
        }
    }


@router.get("/goals/company")
async def list_company_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """List all company preparation goals for authenticated user."""
    repo = CompanyDsaRepository(db)
    stmt = select(Roadmap).where(
        Roadmap.user_id == current_user.id,
        Roadmap.target_companies.isnot(None)
    ).order_by(Roadmap.created_at.desc())
    res = await db.execute(stmt)
    roadmaps = res.scalars().all()

    items = []
    for r in roadmaps:
        if r.target_companies:
            details = await repo.get_goal_companies(r.id, current_user.id)
            total_target = sum(d.question_count for d in details)
            total_solved = sum(d.solved_count for d in details)
            pct = round((total_solved / total_target * 100.0), 1) if total_target > 0 else 0.0

            items.append({
                "id": str(r.id),
                "title": r.title,
                "target_role": r.target_role,
                "target_companies": r.target_companies or [],
                "company_details": [d.model_dump() for d in details],
                "total_target_questions": total_target,
                "total_solved_questions": total_solved,
                "overall_progress": pct,
                "status": r.status
            })

    return {"data": items}


@router.delete("/goals/company/{goal_id}")
async def delete_company_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> dict:
    """Delete a company preparation goal for authenticated user."""
    stmt = select(Roadmap).where(
        Roadmap.id == goal_id,
        Roadmap.user_id == current_user.id
    )
    res = await db.execute(stmt)
    roadmap = res.scalar_one_or_none()
    if not roadmap:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Goal '{goal_id}' not found"
        )

    await db.delete(roadmap)
    await db.commit()
    return {"data": {"message": "Company goal deleted successfully"}}
