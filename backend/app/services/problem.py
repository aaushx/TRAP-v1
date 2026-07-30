from typing import List, Optional
from uuid import UUID
from app.schemas.problem import ProblemCreate, ProblemUpdate, ProblemResponse
from app.repositories.problem import ProblemRepository
from app.core.exceptions import NotFoundException

class ProblemService:
    def __init__(self, repository: ProblemRepository):
        self.repository = repository

    async def get_problems(
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
    ) -> List[ProblemResponse]:
        problems = await self.repository.get_all(
            user_id=user_id,
            search=search,
            difficulty=difficulty,
            status=status,
            platform=platform,
            is_bookmarked=is_bookmarked,
            sort_by=sort_by,
            sort_order=sort_order,
            skip=skip,
            limit=limit
        )
        return problems

    async def get_problem(self, id: UUID, user_id: UUID) -> ProblemResponse:
        problem = await self.repository.get_by_id(id, user_id)
        if not problem:
            raise NotFoundException(message="Problem not found")
        return problem

    async def create_problem(self, user_id: UUID, data: ProblemCreate) -> ProblemResponse:
        problem = await self.repository.create(user_id, data)
        return problem

    async def update_problem(self, id: UUID, user_id: UUID, data: ProblemUpdate) -> ProblemResponse:
        problem = await self.repository.get_by_id(id, user_id)
        if not problem:
            raise NotFoundException(message="Problem not found")
        updated_problem = await self.repository.update(problem, data)
        return updated_problem

    async def delete_problem(self, id: UUID, user_id: UUID) -> None:
        problem = await self.repository.get_by_id(id, user_id)
        if not problem:
            raise NotFoundException(message="Problem not found")
        await self.repository.delete(problem)

    async def bulk_delete_problems(self, ids: List[UUID], user_id: UUID) -> None:
        await self.repository.bulk_delete(ids, user_id)
