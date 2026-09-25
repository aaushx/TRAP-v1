from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Literal, Any
from uuid import UUID

class CompanyBase(BaseModel):
    name: str
    role: str
    status: Literal['wishlist', 'applied', 'interviewing', 'offered', 'rejected'] = "wishlist"
    applied_date: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    job_url: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    
    # Intelligence metadata
    industry: Optional[str] = None
    tier_category: Optional[str] = None
    difficulty: Optional[str] = None
    preparation_topics: Optional[list[str]] = None
    source_metadata: Optional[dict[str, Any]] = None

    # Logo.dev integration & official brand domain fields
    official_domain: Optional[str] = None
    logo_provider: Optional[str] = "logo.dev"
    logo_status: Optional[str] = "UNVERIFIED"

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[Literal['wishlist', 'applied', 'interviewing', 'offered', 'rejected']] = None
    applied_date: Optional[datetime] = None
    interview_date: Optional[datetime] = None
    job_url: Optional[str] = None
    salary_range: Optional[str] = None
    notes: Optional[str] = None
    industry: Optional[str] = None
    tier_category: Optional[str] = None
    difficulty: Optional[str] = None
    preparation_topics: Optional[list[str]] = None
    source_metadata: Optional[dict[str, Any]] = None
    official_domain: Optional[str] = None
    logo_provider: Optional[str] = None
    logo_status: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompanyDirectoryItem(BaseModel):
    rank: int
    name: str
    normalized_key: str
    aliases: list[str] = []
    industry: Optional[str] = None
    tier_category: Optional[str] = None
    score: int
    in_both_datasets: bool
    questions_dataset_1: int
    questions_dataset_2: int
    total_problem_references: int
    overall_difficulty: str
    difficulty_breakdown: dict[str, int]
    top_preparation_topics: list[str]
    hiring_recency_windows: list[str]
    hiring_frequency: str
    job_roles: list[str] = []
    salary_range: Optional[str] = None
    interview_rounds: Optional[str] = None
    sources: list[str] = []
    official_domain: Optional[str] = None
    logo_provider: Optional[str] = "logo.dev"
    logo_status: Optional[str] = "UNVERIFIED"

    model_config = ConfigDict(from_attributes=True)
