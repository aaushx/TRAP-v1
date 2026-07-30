from typing import List, Optional
from uuid import UUID
from app.repositories.company import CompanyRepository
from app.schemas.company import CompanyCreate, CompanyUpdate
from app.core.exceptions import NotFoundException

class CompanyService:
    def __init__(self, repository: CompanyRepository):
        self.repository = repository

    async def get_companies(
        self,
        user_id: UUID,
        search: Optional[str] = None,
        status: Optional[str] = None,
        role: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ):
        return await self.repository.get_all(
            user_id=user_id,
            search=search,
            status=status,
            role=role,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )

    async def get_company(self, id: UUID, user_id: UUID):
        company = await self.repository.get_by_id(id=id, user_id=user_id)
        if not company:
            raise NotFoundException(detail="Company not found")
        return company

    async def create_company(self, user_id: UUID, data: CompanyCreate):
        return await self.repository.create(user_id=user_id, data=data)

    async def update_company(self, id: UUID, user_id: UUID, data: CompanyUpdate):
        company = await self.get_company(id=id, user_id=user_id)
        return await self.repository.update(company=company, data=data)

    async def delete_company(self, id: UUID, user_id: UUID):
        company = await self.get_company(id=id, user_id=user_id)
        await self.repository.delete(company=company)

    async def bulk_delete_companies(self, ids: List[UUID], user_id: UUID) -> None:
        await self.repository.bulk_delete(ids, user_id)
