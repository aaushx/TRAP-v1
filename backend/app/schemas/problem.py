from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, UUID4
from datetime import datetime

class ProblemBase(BaseModel):
    title: str
    platform: str
    platform_url: Optional[str] = None
    topic: str
    difficulty: Literal['easy', 'medium', 'hard']
    status: Literal['solved', 'revisit', 'attempted', 'skipped'] = "solved"
    is_bookmarked: bool = False
    notes: Optional[str] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None

class ProblemCreate(ProblemBase):
    pass

class ProblemUpdate(ProblemBase):
    title: Optional[str] = None
    platform: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[Literal['easy', 'medium', 'hard']] = None
    status: Optional[Literal['solved', 'revisit', 'attempted', 'skipped']] = None
    is_bookmarked: Optional[bool] = None

class ProblemResponse(ProblemBase):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
