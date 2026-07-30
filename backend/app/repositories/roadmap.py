from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.roadmap import Roadmap, RoadmapCategory, RoadmapTopic
from app.schemas.roadmap import GoalCreate, GoalUpdate

class RoadmapRepository:
    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_by_id(self, roadmap_id: UUID) -> Optional[Roadmap]:
        """Get a roadmap by ID with all relationships loaded."""
        stmt = (
            select(Roadmap)
            .where(Roadmap.id == roadmap_id)
            .options(
                selectinload(Roadmap.categories).selectinload(RoadmapCategory.topics)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: UUID) -> List[Roadmap]:
        """Get all roadmaps for a specific user."""
        stmt = (
            select(Roadmap)
            .where(Roadmap.user_id == user_id)
            .options(
                selectinload(Roadmap.categories).selectinload(RoadmapCategory.topics)
            )
            .order_by(Roadmap.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, user_id: UUID, data: GoalCreate) -> Roadmap:
        """Create a new roadmap."""
        db_roadmap = Roadmap(
            user_id=user_id,
            title=data.title,
            description=data.description,
            target_role=data.target_role,
            target_companies=data.target_companies,
            deadline=data.deadline,
            priority=data.priority,
            status=data.status
        )
        self.session.add(db_roadmap)
        await self.session.flush()

        # Add categories and topics
        for i, category_data in enumerate(data.categories):
            db_category = RoadmapCategory(
                roadmap_id=db_roadmap.id,
                name=category_data.name,
                sort_order=category_data.sort_order if category_data.sort_order else i
            )
            self.session.add(db_category)
            await self.session.flush()

            for j, topic_data in enumerate(category_data.topics):
                db_topic = RoadmapTopic(
                    category_id=db_category.id,
                    name=topic_data.name,
                    status=topic_data.status,
                    difficulty=topic_data.difficulty,
                    estimated_hours=topic_data.estimated_hours,
                    resource_links=topic_data.resource_links,
                    sort_order=topic_data.sort_order if topic_data.sort_order else j
                )
                self.session.add(db_topic)

        await self.session.commit()
        await self.session.refresh(db_roadmap)
        return await self.get_by_id(db_roadmap.id)

    async def update(self, roadmap_id: UUID, data: GoalUpdate) -> Optional[Roadmap]:
        """Update a roadmap."""
        roadmap = await self.get_by_id(roadmap_id)
        if not roadmap:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(roadmap, key, value)

        await self.session.commit()
        await self.session.refresh(roadmap)
        return roadmap

    async def delete(self, roadmap_id: UUID) -> bool:
        """Delete a roadmap."""
        roadmap = await self.get_by_id(roadmap_id)
        if not roadmap:
            return False

        await self.session.delete(roadmap)
        await self.session.commit()
        return True

    async def get_topic_by_id(self, topic_id: UUID) -> Optional[RoadmapTopic]:
        """Get a roadmap topic by ID."""
        stmt = select(RoadmapTopic).where(RoadmapTopic.id == topic_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_topic_status(self, topic_id: UUID, status: Optional[str] = None, notes: Optional[str] = None) -> Optional[RoadmapTopic]:
        """Update the status and notes of a specific topic."""
        topic = await self.get_topic_by_id(topic_id)
        if not topic:
            return None

        if status is not None:
            topic.status = status
        if notes is not None:
            topic.notes = notes
        await self.session.commit()
        await self.session.refresh(topic)
        return topic
