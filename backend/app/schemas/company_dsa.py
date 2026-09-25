from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Literal, Dict
from uuid import UUID

class CompanyDsaListItem(BaseModel):
    id: UUID
    name: str
    slug: str
    aliases: List[str] = []
    question_count: int = 0
    is_top_30: bool = False
    rank: Optional[int] = None
    user_solved_count: int = 0
    remaining_count: int = 0
    user_progress_percentage: float = 0.0
    official_domain: Optional[str] = None
    logo_provider: Optional[str] = "logo.dev"
    logo_status: Optional[str] = "UNVERIFIED"

    model_config = ConfigDict(from_attributes=True)

class DifficultyStat(BaseModel):
    total: int = 0
    solved: int = 0

class TopicStat(BaseModel):
    topic: str
    total: int = 0
    solved: int = 0
    progress: float = 0.0

class CompanyDsaDetail(BaseModel):
    id: UUID
    name: str
    slug: str
    question_count: int = 0
    solved_count: int = 0
    attempted_count: int = 0
    needs_revision_count: int = 0
    remaining_count: int = 0
    progress_percentage: float = 0.0
    difficulty_breakdown: Dict[str, DifficultyStat] = {}
    topic_breakdown: List[TopicStat] = []
    official_domain: Optional[str] = None
    logo_provider: Optional[str] = "logo.dev"
    logo_status: Optional[str] = "UNVERIFIED"

    model_config = ConfigDict(from_attributes=True)

class CompanyDsaQuestionItem(BaseModel):
    id: UUID
    external_id: Optional[str] = None
    title: str
    slug: str
    difficulty: str
    platform_url: Optional[str] = None
    topics: List[str] = []
    frequency: Optional[str] = None
    time_periods: List[str] = []
    companies: List[str] = []
    status: Literal['not_started', 'attempted', 'solved', 'needs_revision'] = 'not_started'
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class QuestionDetailResponse(BaseModel):
    id: UUID
    external_id: Optional[str] = None
    title: str
    slug: str
    difficulty: str
    platform_url: Optional[str] = None
    topics: List[str] = []
    frequency: Optional[str] = None
    acceptance_rate: Optional[str] = None
    companies: List[str] = []
    company_count: int = 0
    status: Literal['not_started', 'attempted', 'solved', 'needs_revision'] = 'not_started'
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PaginatedQuestionsResponse(BaseModel):
    items: List[CompanyDsaQuestionItem]
    total: int
    page: int
    page_size: int
    total_pages: int

class QuestionStatusUpdatePayload(BaseModel):
    status: Literal['not_started', 'attempted', 'solved', 'needs_revision']
    notes: Optional[str] = None

class GoalCompanyItem(BaseModel):
    company_id: UUID
    name: str
    slug: str
    question_count: int = 0
    solved_count: int = 0
    remaining_count: int = 0
    progress_percentage: float = 0.0
    official_domain: Optional[str] = None
    logo_provider: Optional[str] = "logo.dev"
    logo_status: Optional[str] = "UNVERIFIED"

class CompanyGoalCreatePayload(BaseModel):
    company_slugs: List[str]
    title: Optional[str] = None
    target_date: Optional[str] = None
    target_questions_count: Optional[int] = 50

class CompanyGoalResponse(BaseModel):
    id: UUID
    title: str
    target_role: str
    target_companies: List[str]
    company_details: List[GoalCompanyItem] = []
    total_target_questions: int = 0
    total_solved_questions: int = 0
    overall_progress: float = 0.0
    status: str = "active"

    model_config = ConfigDict(from_attributes=True)
