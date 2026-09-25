import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.models.base import Base

class Company(Base):
    """Company model representing a user's tracked recruitment pipeline target,
    enriched with optional reference intelligence (industry, tier, preparation topics).
    """
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, nullable=False, default="wishlist") # wishlist, applied, interviewing, offered, rejected
    applied_date = Column(DateTime(timezone=True), nullable=True)
    interview_date = Column(DateTime(timezone=True), nullable=True)
    job_url = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    
    # Official brand domain and verified logo provider configuration
    # official_domain serves as the primary identity anchor for Logo.dev Image API rendering
    official_domain = Column(String, nullable=True, index=True)
    logo_provider = Column(String, nullable=True, default="logo.dev")
    logo_status = Column(String, nullable=False, default="UNVERIFIED")  # VERIFIED, UNVERIFIED, REJECTED
    
    # Optional Placement & Company Intelligence fields
    industry = Column(String, nullable=True)
    tier_category = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    preparation_topics = Column(JSONB, nullable=True)
    source_metadata = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
