"""TRAP — Study Planner Database Models

Defines the normalized data entities supporting the Study Planner module:
- StudyPlan: multi-day preparation plan envelope
- StudyTask: scheduled study or practice unit linked to goals, companies, or problems
- StudySession: tracked execution session recording real study duration
"""
import uuid
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Integer, Float, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base


class StudyPlan(Base):
    """Represents a student's high-level study plan period (e.g., '1-Week Capgemini Sprint').
    Contains multiple scheduled tasks across the specified date window.
    """
    __tablename__ = "study_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(50), nullable=False, default="active")  # active, completed, archived
    target_hours = Column(Float, nullable=False, default=0.0)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    tasks = relationship("StudyTask", back_populates="study_plan", cascade="all, delete-orphan")


class StudyTask(Base):
    """Represents an individual scheduled preparation activity.
    Can be tied directly to a Goal (Roadmap), a DSA Problem, a Target Company, or Company Question.
    """
    __tablename__ = "study_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    study_plan_id = Column(UUID(as_uuid=True), ForeignKey("study_plans.id", ondelete="SET NULL"), nullable=True, index=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Category and Type classification
    # DSA, APTITUDE, REASONING, VERBAL, CS_FUNDAMENTALS, MOCK_TEST, REVISION, PROJECT, COMPANY_PREP, OTHER
    task_type = Column(String(50), nullable=False, default="DSA", index=True)
    category = Column(String(100), nullable=False, default="DSA", index=True)
    priority = Column(String(20), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH

    # Scheduling
    scheduled_date = Column(Date, nullable=False, index=True)
    start_time = Column(String(10), nullable=True)  # Format HH:MM (e.g., '09:00')
    end_time = Column(String(10), nullable=True)    # Format HH:MM (e.g., '10:30')
    estimated_minutes = Column(Integer, nullable=False, default=30)
    actual_minutes = Column(Integer, nullable=False, default=0)

    # Status tracking: TODO, IN_PROGRESS, COMPLETED, SKIPPED, OVERDUE
    status = Column(String(30), nullable=False, default="TODO", index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    recurrence_rule = Column(String(50), nullable=True)

    # Optional foreign associations (SET NULL on delete to prevent cascading loss of task history)
    goal_id = Column(UUID(as_uuid=True), ForeignKey("roadmaps.id", ondelete="SET NULL"), nullable=True, index=True)
    problem_id = Column(UUID(as_uuid=True), ForeignKey("problems.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("dsa_companies.id", ondelete="SET NULL"), nullable=True, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("company_questions.id", ondelete="SET NULL"), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    study_plan = relationship("StudyPlan", back_populates="tasks")
    sessions = relationship("StudySession", back_populates="task", cascade="all, delete-orphan")
    goal = relationship("Roadmap")
    problem = relationship("Problem")
    company = relationship("DsaCompany")
    question = relationship("CompanyQuestion")

    __table_args__ = (
        Index("ix_study_tasks_user_date", "user_id", "scheduled_date"),
        Index("ix_study_tasks_user_status", "user_id", "status"),
    )


class StudySession(Base):
    """Records an executed focus session for a task, powering live study timers and analytics."""
    __tablename__ = "study_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("study_tasks.id", ondelete="SET NULL"), nullable=True, index=True)

    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    task = relationship("StudyTask", back_populates="sessions")

    __table_args__ = (
        Index("ix_study_sessions_user_started", "user_id", "started_at"),
    )
