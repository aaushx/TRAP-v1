from typing import List, Optional, Sequence
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company
from app.schemas.company import CompanyCreate, CompanyUpdate

class CompanyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, id: UUID, user_id: UUID) -> Optional[Company]:
        result = await self.session.execute(
            select(Company).where(Company.id == id, Company.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        user_id: UUID,
        search: Optional[str] = None,
        status: Optional[str] = None,
        role: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Sequence[Company]:
        stmt = select(Company).where(Company.user_id == user_id)
        
        # Apply filters
        if search:
            stmt = stmt.where(Company.name.ilike(f"%{search}%"))
        if status:
            stmt = stmt.where(Company.status == status)
        if role:
            stmt = stmt.where(Company.role.ilike(f"%{role}%"))
            
        # Apply sorting
        order_col = getattr(Company, sort_by, Company.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())
            
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, user_id: UUID, data: CompanyCreate) -> Company:
        company = Company(
            user_id=user_id,
            **data.model_dump()
        )
        self.session.add(company)
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def update(self, company: Company, data: CompanyUpdate) -> Company:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(company, key, value)
        await self.session.commit()
        await self.session.refresh(company)
        return company

    async def delete(self, company: Company) -> None:
        await self.session.delete(company)
        await self.session.commit()

    async def bulk_delete(self, ids: List[UUID], user_id: UUID) -> None:
        stmt = delete(Company).where(Company.id.in_(ids), Company.user_id == user_id)
        await self.session.execute(stmt)
        await self.session.commit()
