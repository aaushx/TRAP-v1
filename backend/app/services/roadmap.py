from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException

from app.schemas.roadmap import GoalCreate, GoalUpdate, GoalCategoryCreate, GoalTopicCreate, GoalGenerateRequest
from app.repositories.roadmap import RoadmapRepository

class RoadmapService:
    def __init__(self, repository: RoadmapRepository):
        """Initialize with repository."""
        self.repository = repository

    async def get_by_id(self, roadmap_id: UUID) -> Optional[dict]:
        """Get a roadmap by ID."""
        roadmap = await self.repository.get_by_id(roadmap_id)
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return roadmap

    async def get_by_user_id(self, user_id: UUID) -> List[dict]:
        """Get all roadmaps for a user."""
        return await self.repository.get_by_user_id(user_id)

    async def create(self, user_id: UUID, data: GoalCreate) -> dict:
        """Create a new roadmap."""
        return await self.repository.create(user_id, data)

    async def update(self, roadmap_id: UUID, data: GoalUpdate) -> dict:
        """Update a roadmap."""
        roadmap = await self.repository.update(roadmap_id, data)
        if not roadmap:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return roadmap

    async def delete(self, roadmap_id: UUID) -> bool:
        """Delete a roadmap."""
        success = await self.repository.delete(roadmap_id)
        if not success:
            raise HTTPException(status_code=404, detail="Roadmap not found")
        return True

    async def update_topic_status(self, topic_id: UUID, status: Optional[str] = None, notes: Optional[str] = None) -> dict:
        """Update the status and notes of a topic."""
        topic = await self.repository.update_topic_status(topic_id, status, notes)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        return topic

    def _load_library(self):
        import os
        import json
        base_dir = os.path.join(os.path.dirname(__file__), "..", "core", "library")
        topics_dir = os.path.join(base_dir, "topics")
        companies_dir = os.path.join(base_dir, "companies")
        
        self.master_topics = []
        if os.path.exists(topics_dir):
            for file in os.listdir(topics_dir):
                if file.endswith(".json"):
                    with open(os.path.join(topics_dir, file), "r") as f:
                        self.master_topics.extend(json.load(f))
                        
        self.company_templates = {}
        if os.path.exists(companies_dir):
            for file in os.listdir(companies_dir):
                if file.endswith(".json"):
                    with open(os.path.join(companies_dir, file), "r") as f:
                        name = file.replace(".json", "").title()
                        self.company_templates[name] = json.load(f)

    def get_library(self):
        self._load_library()
        return self.master_topics
        
    def get_companies(self):
        self._load_library()
        return self.company_templates

