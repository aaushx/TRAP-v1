"""Analytics Schemas for TRAP Placement Preparation Operating System.

Defines Pydantic response models for user preparation analytics, problem breakdowns,
company application funnels, goal progress distributions, and study trends.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, ConfigDict


class ProblemDifficultyStats(BaseModel):
    """Counts of solved problems categorized by difficulty level."""
    easy: int = 0
    medium: int = 0
    hard: int = 0


class ProblemPlatformStats(BaseModel):
    """Problems count grouped by coding platform."""
    platform: str
    count: int


class ProblemTopicStats(BaseModel):
    """Problems count grouped by topic."""
    topic: str
    count: int


class ProblemsAnalytics(BaseModel):
    """Comprehensive problem solving metrics."""
    total_solved: int
    total_tracked: int
    by_difficulty: ProblemDifficultyStats
    by_platform: List[ProblemPlatformStats]
    by_topic: List[ProblemTopicStats]


class CompanyFunnelStats(BaseModel):
    """Company job applications progression stages."""
    wishlist: int = 0
    applied: int = 0
    interviewing: int = 0
    offered: int = 0
    rejected: int = 0


class CompaniesAnalytics(BaseModel):
    """Company tracking and application pipeline analytics."""
    total_tracked: int
    funnel: CompanyFunnelStats
    by_role: Dict[str, int]
    recent_applications: List[Dict[str, Optional[str]]]


class GoalTopicStatusBreakdown(BaseModel):
    """Topic counts categorized by preparation status across all user goals."""
    not_started: int = 0
    bookmarked: int = 0
    in_progress: int = 0
    needs_revision: int = 0
    completed: int = 0
    mastered: int = 0
    skipped: int = 0


class CategoryProgressItem(BaseModel):
    """Progress statistics for a specific category across goals."""
    name: str
    completed_topics: int
    total_topics: int
    percentage: int
    estimated_hours_remaining: float


class GoalsAnalytics(BaseModel):
    """Goal and roadmap completion metrics."""
    total_goals: int
    active_goals: int
    completed_goals: int
    average_progress: int
    total_topics: int
    completed_topics: int
    topic_status_breakdown: GoalTopicStatusBreakdown
    category_progress: List[CategoryProgressItem]


class ActivityTrendItem(BaseModel):
    """Daily problem activity counts for study trend charting."""
    date: str
    problems_solved: int


class StudyDistributionItem(BaseModel):
    """Remaining estimated hours per subject category."""
    category: str
    estimated_hours_remaining: float
    topics_count: int


class ReadinessAnalytics(BaseModel):
    """Placement readiness and category strengths summary."""
    placement_readiness_index: int
    strengths: List[str]
    needs_improvement: List[str]
    current_streak: int
    remaining_study_time: float


class AnalyticsSummaryResponse(BaseModel):
    """Root response model returned by GET /api/v1/analytics/summary."""
    problems: ProblemsAnalytics
    companies: CompaniesAnalytics
    goals: GoalsAnalytics
    readiness: ReadinessAnalytics
    activity_trends: List[ActivityTrendItem]
    study_distribution: List[StudyDistributionItem]

    model_config = ConfigDict(from_attributes=True)
