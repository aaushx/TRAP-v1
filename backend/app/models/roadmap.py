import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.models.base import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    target_role = Column(String, nullable=False)
    target_companies = Column(JSONB, nullable=True) # List of strings
    deadline = Column(DateTime(timezone=True), nullable=True)
    priority = Column(String, nullable=False, default="Medium")
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    categories = relationship("RoadmapCategory", back_populates="roadmap", cascade="all, delete-orphan")

class RoadmapCategory(Base):
    __tablename__ = "roadmap_categories"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    roadmap_id = Column(UUID(as_uuid=True), ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    roadmap = relationship("Roadmap", back_populates="categories")
    topics = relationship("RoadmapTopic", back_populates="category", cascade="all, delete-orphan")

class RoadmapTopic(Base):
    __tablename__ = "roadmap_topics"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("roadmap_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="not_started") # not_started, in_progress, completed
    difficulty = Column(String, nullable=True) # easy, medium, hard
    estimated_hours = Column(Float, nullable=True)
    resource_links = Column(JSONB, nullable=True) # List of dicts {"title": str, "url": str}
    notes = Column(String, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    category = relationship("RoadmapCategory", back_populates="topics")
