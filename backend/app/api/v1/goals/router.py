from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.database.engine import get_db_session
from app.models.user import User
from app.models.roadmap import RoadmapCategory, RoadmapTopic
from app.schemas.roadmap import (
    GoalResponse,
    GoalCreate,
    GoalUpdate,
    GoalGenerateRequest,
    GoalTopicStatusUpdate,
    GoalTopicResponse
)
from app.schemas.company_question import (
    CompanyPreparationResponse,
    QuestionProgressUpdate
)
from app.repositories.roadmap import RoadmapRepository
from app.repositories.company_question import CompanyQuestionRepository
from app.services.roadmap import RoadmapService

router = APIRouter()

def get_roadmap_service(db: AsyncSession = Depends(get_db_session)) -> RoadmapService:
    """Dependency to get RoadmapService (internally serving Goals)."""
    repository = RoadmapRepository(db)
    return RoadmapService(repository)

@router.get("/library")
async def get_topic_library(
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Get the Master Topic Library (user-facing: Goal Library)."""
    return service.get_library()

@router.get("/companies")
async def get_company_intelligence(
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Get Company Intelligence Templates (user-facing: Goal Company Templates)."""
    return service.get_companies()

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Create a new custom goal."""
    return await service.create(current_user.id, data)

@router.get("", response_model=List[GoalResponse], include_in_schema=False)
@router.get("/", response_model=List[GoalResponse])
async def get_goals(
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Get all goals for the authenticated user."""
    return await service.get_by_user_id(current_user.id)

@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Get details of a specific goal. Ensures user ownership."""
    roadmap = await service.get_by_id(goal_id)
    if roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal"
        )
    return roadmap

@router.patch("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Update details of a specific goal. Ensures user ownership."""
    roadmap = await service.get_by_id(goal_id)
    if roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal"
        )
    return await service.update(goal_id, data)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Delete a specific goal. Ensures user ownership."""
    roadmap = await service.get_by_id(goal_id)
    if roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal"
        )
    await service.delete(goal_id)
    return None

@router.patch("/topics/{topic_id}/status", response_model=GoalTopicResponse)
async def update_topic_status(
    topic_id: UUID,
    data: GoalTopicStatusUpdate,
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service)
):
    """Update the status/notes of a specific topic. Validates user ownership."""
    # 1. Fetch the topic
    topic = await service.repository.get_topic_by_id(topic_id)
    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found"
        )
    
    # 2. Fetch the category to find the roadmap_id
    category_stmt = select(RoadmapCategory).where(RoadmapCategory.id == topic.category_id)
    category_result = await service.repository.session.execute(category_stmt)
    category = category_result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found for topic"
        )

    # 3. Check ownership of the roadmap/goal
    roadmap = await service.get_by_id(category.roadmap_id)
    if roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal's topics"
        )

    return await service.update_topic_status(topic_id, data.status, data.notes)

@router.get("/{goal_id}/company-preparation", response_model=CompanyPreparationResponse)
async def get_goal_company_preparation(
    goal_id: UUID,
    company: Optional[str] = Query(None, description="Filter questions by target company name"),
    topic: Optional[str] = Query(None, description="Filter questions by DSA topic"),
    difficulty: Optional[str] = Query(None, description="Filter questions by difficulty (Easy, Medium, Hard)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter questions by status (not_started, attempted, solved, needs_revision)"),
    search: Optional[str] = Query(None, description="Search questions by title"),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    service: RoadmapService = Depends(get_roadmap_service),
    db: AsyncSession = Depends(get_db_session)
):
    """Retrieve company-wise DSA preparation topics, questions, and progress for a goal."""
    roadmap = await service.get_by_id(goal_id)
    if roadmap.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal"
        )
    
    cq_repo = CompanyQuestionRepository(db)
    target_companies = roadmap.target_companies or []
    return await cq_repo.get_company_preparation(
        goal_id=goal_id,
        goal_title=roadmap.title,
        target_companies=target_companies,
        user_id=current_user.id,
        company_filter=company,
        topic_filter=topic,
        difficulty_filter=difficulty,
        status_filter=status_filter,
        search=search,
        skip=skip,
        limit=limit
    )

@router.patch("/questions/{question_id}/progress")
async def update_question_progress(
    question_id: UUID,
    data: QuestionProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update authenticated user's progress on a company question. Guarantees multi-tenant isolation."""
    cq_repo = CompanyQuestionRepository(db)
    question = await cq_repo.get_by_id(question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    progress = await cq_repo.upsert_user_progress(
        user_id=current_user.id,
        question_id=question_id,
        status=data.status,
        notes=data.notes
    )
    return {
        "question_id": progress.question_id,
        "status": progress.status,
        "notes": progress.notes,
        "updated_at": progress.updated_at
    }
