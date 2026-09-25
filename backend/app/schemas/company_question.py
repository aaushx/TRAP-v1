from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from uuid import UUID

class CompanyQuestionResponse(BaseModel):
    id: UUID
    title: str
    slug: str
    difficulty: str
    platform_url: Optional[str] = None
    topics: list[str] = []
    companies: list[str] = []
    company_count: int = 1
    acceptance_rate: Optional[str] = None
    frequency: Optional[str] = None
    status: Literal['not_started', 'attempted', 'solved', 'needs_revision'] = 'not_started'
    user_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class QuestionProgressUpdate(BaseModel):
    status: Literal['not_started', 'attempted', 'solved', 'needs_revision']
    notes: Optional[str] = None

class CompanyPreparationStats(BaseModel):
    company_name: str
    total_questions: int
    solved_questions: int
    progress_percentage: float
    topics_covered: int
    total_topics: int

class TopicPreparationBreakdown(BaseModel):
    topic_name: str
    total_questions: int
    solved_questions: int

class CompanyPreparationResponse(BaseModel):
    goal_id: UUID
    goal_title: str
    target_companies: list[str]
    overall_progress_percentage: float
    total_unique_questions: int
    solved_unique_questions: int
    company_stats: list[CompanyPreparationStats]
    topic_breakdown: list[TopicPreparationBreakdown]
    questions: list[CompanyQuestionResponse]

    model_config = ConfigDict(from_attributes=True)
