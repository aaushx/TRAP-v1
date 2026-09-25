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

    @staticmethod
    def get_directory(search: Optional[str] = None) -> list[dict]:
        """Fetch verified Top 30 targeted companies reference intelligence directory."""
        import json
        import os
        
        dir_file = os.path.join(os.path.dirname(__file__), "..", "core", "library", "top_30_companies.json")
        if not os.path.exists(dir_file):
            return []
            
        with open(dir_file, "r", encoding="utf-8") as f:
            items = json.load(f)
            
        if search:
            q = search.lower().strip()
            items = [
                c for c in items 
                if q in c.get("name", "").lower() 
                or any(q in a.lower() for a in c.get("aliases", []))
                or q in c.get("industry", "").lower()
                or q in c.get("tier_category", "").lower()
                or any(q in t.lower() for t in c.get("top_preparation_topics", []))
            ]
            
        return items
