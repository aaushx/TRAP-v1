from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, computed_field
from datetime import datetime
from uuid import UUID

class GoalTopicBase(BaseModel):
    name: str
    status: Optional[str] = "not_started"
    difficulty: Optional[str] = None
    estimated_hours: Optional[float] = None
    resource_links: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = 0

class GoalTopicCreate(GoalTopicBase):
    pass

class GoalTopicUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    difficulty: Optional[str] = None
    estimated_hours: Optional[float] = None
    resource_links: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
    sort_order: Optional[int] = None

class GoalTopicStatusUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class GoalTopicResponse(GoalTopicBase):
    id: UUID
    category_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class GoalCategoryBase(BaseModel):
    name: str
    sort_order: Optional[int] = 0

class GoalCategoryCreate(GoalCategoryBase):
    topics: List[GoalTopicCreate] = []

class GoalCategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None

class GoalCategoryResponse(GoalCategoryBase):
    id: UUID
    roadmap_id: UUID
    created_at: datetime
    updated_at: datetime
    topics: List[GoalTopicResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_role: str
    target_companies: Optional[List[str]] = []
    deadline: Optional[datetime] = None
    priority: Optional[str] = "Medium"
    status: Optional[str] = "active"

class GoalCreate(GoalBase):
    categories: List[GoalCategoryCreate] = []

class GoalGenerateRequest(BaseModel):
    target_role: str
    target_companies: List[str]

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_role: Optional[str] = None
    target_companies: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class GoalResponse(GoalBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    categories: List[GoalCategoryResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

    @computed_field
    def progress(self) -> int:
        """Dynamically compute progress based on completed/mastered topics."""
        total_topics = 0
        completed_topics = 0
        for category in self.categories:
            for topic in category.topics:
                total_topics += 1
                if topic.status in ("completed", "mastered"):
                    completed_topics += 1
        if total_topics == 0:
            return 0
        return round((completed_topics / total_topics) * 100)
