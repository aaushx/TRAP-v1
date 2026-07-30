from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database.engine import get_db_session
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.repositories.company import CompanyRepository
from app.services.company import CompanyService

router = APIRouter()

def get_company_service(session: AsyncSession = Depends(get_db_session)) -> CompanyService:
    """Dependency to inject the CompanyService with an active database session."""
    repository = CompanyRepository(session=session)
    return CompanyService(repository=repository)

@router.get("/", response_model=List[CompanyResponse])
async def list_companies(
    search: Optional[str] = Query(None, description="Search by company name"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by application status (wishlist, applied, interviewing, offered, rejected)"),
    role: Optional[str] = Query(None, description="Filter by job role name"),
    sort_by: str = Query("created_at", description="Sort by field (created_at, name, status, applied_date, interview_date)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    skip: int = Query(0, ge=0, description="Offset for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Limit for pagination"),
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    """List tracked companies with optional search, filters, sorting, and pagination."""
    return await service.get_companies(
        user_id=current_user.id,
        search=search,
        status=status_filter,
        role=role,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit
    )

@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_companies(
    ids: List[UUID],
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    """Delete multiple companies owned by the authenticated user in one transaction."""
    await service.bulk_delete_companies(ids, current_user.id)
    return {"message": f"Successfully deleted {len(ids)} companies"}

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    """Create a new company pipeline entry."""
    return await service.create_company(user_id=current_user.id, data=data)

@router.get("/{id}", response_model=CompanyResponse)
async def get_company(
    id: UUID,
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    """Retrieve details of a specific tracked company. Validates ownership."""
    return await service.get_company(id=id, user_id=current_user.id)

@router.put("/{id}", response_model=CompanyResponse)
async def update_company(
    id: UUID,
    data: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    """Update details of an existing company entry. Validates ownership."""
    return await service.update_company(id=id, user_id=current_user.id, data=data)

@router.delete("/{id}")
async def delete_company(
    id: UUID,
    current_user: User = Depends(get_current_user),
    service: CompanyService = Depends(get_company_service),
):
    """Delete a specific company entry. Validates ownership."""
    await service.delete_company(id=id, user_id=current_user.id)
    return {"message": "Company deleted successfully"}
