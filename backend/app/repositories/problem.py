from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.problem import Problem
from app.schemas.problem import ProblemCreate, ProblemUpdate

class ProblemRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, id: UUID, user_id: UUID) -> Optional[Problem]:
        stmt = select(Problem).where(Problem.id == id, Problem.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_all(
        self,
        user_id: UUID,
        search: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        platform: Optional[str] = None,
        is_bookmarked: Optional[bool] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> List[Problem]:
        stmt = select(Problem).where(Problem.user_id == user_id)
        
        # Apply filters
        if search:
            stmt = stmt.where(
                (Problem.title.ilike(f"%{search}%")) |
                (Problem.topic.ilike(f"%{search}%"))
            )
        if difficulty:
            stmt = stmt.where(Problem.difficulty == difficulty)
        if status:
            stmt = stmt.where(Problem.status == status)
        if platform:
            stmt = stmt.where(Problem.platform == platform)
        if is_bookmarked is not None:
            stmt = stmt.where(Problem.is_bookmarked == is_bookmarked)
            
        # Apply sorting
        order_col = getattr(Problem, sort_by, Problem.created_at)
        if sort_order == "desc":
            stmt = stmt.order_by(order_col.desc())
        else:
            stmt = stmt.order_by(order_col.asc())
            
        # Apply pagination
        stmt = stmt.offset(skip).limit(limit)
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, user_id: UUID, data: ProblemCreate) -> Problem:
        db_obj = Problem(**data.model_dump(), user_id=user_id)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(self, problem: Problem, data: ProblemUpdate) -> Problem:
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(problem, field, value)
        await self.session.commit()
        await self.session.refresh(problem)
        return problem

    async def delete(self, problem: Problem) -> None:
        await self.session.delete(problem)
        await self.session.commit()

    async def bulk_delete(self, ids: List[UUID], user_id: UUID) -> None:
        stmt = delete(Problem).where(Problem.id.in_(ids), Problem.user_id == user_id)
        await self.session.execute(stmt)
        await self.session.commit()
