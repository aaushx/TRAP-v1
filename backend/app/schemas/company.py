from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Literal
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

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(CompanyBase):
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[Literal['wishlist', 'applied', 'interviewing', 'offered', 'rejected']] = None

class CompanyResponse(CompanyBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
