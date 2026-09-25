import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class DsaCompany(Base):
    """Normalized company entity extracted from the LeetCode interview datasets."""
    __tablename__ = "dsa_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    aliases = Column(JSONB, nullable=False, default=list) # e.g. ["Amazon.com", "amazon"]
    question_count = Column(Integer, nullable=False, default=0)
    is_top_30 = Column(Boolean, nullable=False, default=False)
    rank = Column(Integer, nullable=True)

    # Official brand domain and verified logo provider configuration
    # official_domain is the identity anchor used for client-side Logo.dev image resolution
    official_domain = Column(String, nullable=True, index=True)
    logo_provider = Column(String, nullable=True, default="logo.dev")
    logo_status = Column(String, nullable=False, default="UNVERIFIED")  # VERIFIED, UNVERIFIED, REJECTED

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    questions = relationship(
        "CompanyQuestion",
        secondary="dsa_company_questions",
        back_populates="companies_rel",
        overlaps="company,company_question_links,question"
    )
    company_question_links = relationship(
        "DsaCompanyQuestion",
        back_populates="company",
        cascade="all, delete-orphan",
        overlaps="companies_rel,questions"
    )
    goal_associations = relationship(
        "GoalCompany",
        back_populates="company",
        cascade="all, delete-orphan"
    )


class DsaCompanyQuestion(Base):
    """Junction table connecting DsaCompany to CompanyQuestion with per-company metrics."""
    __tablename__ = "dsa_company_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("dsa_companies.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("company_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    frequency = Column(String, nullable=True)
    time_periods = Column(JSONB, nullable=False, server_default='[]') # e.g. ["thirty_days", "three_months", "six_months", "more_than_six_months", "all"]
    source_file = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    company = relationship(
        "DsaCompany",
        back_populates="company_question_links",
        overlaps="companies_rel,questions"
    )
    question = relationship(
        "CompanyQuestion",
        overlaps="companies_rel,questions"
    )

    __table_args__ = (
        UniqueConstraint("company_id", "question_id", name="uq_dsa_company_question"),
    )


class CompanyQuestion(Base):
    """Shared canonical DSA question reference dataset extracted from archives."""
    __tablename__ = "company_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    external_id = Column(String, nullable=True, index=True) # LeetCode problem ID e.g. "2938"
    title = Column(String, nullable=False, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    difficulty = Column(String, nullable=False, default="Medium") # Easy, Medium, Hard
    platform_url = Column(String, nullable=True)
    topics = Column(JSONB, nullable=False, default=list) # e.g. ["Array", "Hash Table"]
    companies = Column(JSONB, nullable=False, default=list) # list of company names
    company_count = Column(Integer, nullable=False, default=1)
    acceptance_rate = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    source_dataset = Column(String, nullable=False, server_default="MERGED")

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    companies_rel = relationship(
        "DsaCompany",
        secondary="dsa_company_questions",
        back_populates="questions",
        overlaps="company,company_question_links,question"
    )
    progress_records = relationship(
        "UserQuestionProgress",
        back_populates="question",
        cascade="all, delete-orphan"
    )


class UserQuestionProgress(Base):
    """User-specific question progress ensuring strict multi-tenant isolation."""
    __tablename__ = "user_question_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("company_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, nullable=False, default="not_started") # not_started, attempted, solved, needs_revision
    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    question = relationship("CompanyQuestion", back_populates="progress_records")

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_question_progress"),
    )


class GoalCompany(Base):
    """Normalized many-to-many relationship linking a Goal (Roadmap) to a target DsaCompany."""
    __tablename__ = "goal_companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("dsa_companies.id", ondelete="CASCADE"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    goal = relationship("Roadmap", back_populates="goal_companies")
    company = relationship("DsaCompany", back_populates="goal_associations")

    __table_args__ = (
        UniqueConstraint("goal_id", "company_id", name="uq_goal_company"),
    )
