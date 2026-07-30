from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.engine import get_db_session
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.problem import ProblemResponse, ProblemCreate, ProblemUpdate
from app.repositories.problem import ProblemRepository
from app.services.problem import ProblemService

router = APIRouter()

def get_problem_service(session: AsyncSession = Depends(get_db_session)) -> ProblemService:
    repository = ProblemRepository(session)
    return ProblemService(repository)

@router.get("/", response_model=List[ProblemResponse])
async def get_problems(
    search: Optional[str] = Query(None, description="Search by title or topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (easy, medium, hard)"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (solved, revisit, attempted, skipped)"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    is_bookmarked: Optional[bool] = Query(None, description="Filter by favorite/bookmark status"),
    sort_by: str = Query("created_at", description="Sort by field (created_at, title, difficulty, platform, status)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    current_user: User = Depends(get_current_user),
    problem_service: ProblemService = Depends(get_problem_service)
):
    """List problems with optional search, filters, sorting, and pagination."""
    return await problem_service.get_problems(
        user_id=current_user.id,
        search=search,
        difficulty=difficulty,
        status=status_filter,
        platform=platform,
        is_bookmarked=is_bookmarked,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )

@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_problems(
    ids: List[UUID],
    current_user: User = Depends(get_current_user),
    problem_service: ProblemService = Depends(get_problem_service)
):
    """Delete multiple problems owned by the authenticated user in one transaction."""
    await problem_service.bulk_delete_problems(ids, current_user.id)
    return {"message": f"Successfully deleted {len(ids)} problems"}

@router.get("/{id}", response_model=ProblemResponse)
async def get_problem(
    id: UUID,
    current_user: User = Depends(get_current_user),
    problem_service: ProblemService = Depends(get_problem_service)
):
    """Retrieve details of a specific problem. Validates ownership."""
    return await problem_service.get_problem(id, current_user.id)

@router.post("/", response_model=ProblemResponse, status_code=status.HTTP_201_CREATED)
async def create_problem(
    data: ProblemCreate,
    current_user: User = Depends(get_current_user),
    problem_service: ProblemService = Depends(get_problem_service)
):
    """Create a new problem tracker entry."""
    return await problem_service.create_problem(current_user.id, data)

@router.put("/{id}", response_model=ProblemResponse)
async def update_problem(
    id: UUID,
    data: ProblemUpdate,
    current_user: User = Depends(get_current_user),
    problem_service: ProblemService = Depends(get_problem_service)
):
    """Update details of an existing problem entry. Validates ownership."""
    return await problem_service.update_problem(id, current_user.id, data)

@router.delete("/{id}")
async def delete_problem(
    id: UUID,
    current_user: User = Depends(get_current_user),
    problem_service: ProblemService = Depends(get_problem_service)
):
    """Delete a specific problem entry. Validates ownership."""
    await problem_service.delete_problem(id, current_user.id)
    return {"message": "Problem deleted successfully"}
