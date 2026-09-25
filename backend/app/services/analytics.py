"""Analytics Service for TRAP Placement Preparation Operating System.

Provides aggregated metrics across problems solved, company recruitment pipelines,
roadmap goal completion rates, daily activity velocity, and subject study distributions.
All data is aggregated in real-time from active database records with zero mock data.
"""

from uuid import UUID
from datetime import date, timedelta
from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date, desc
from sqlalchemy.orm import selectinload

from app.models.problem import Problem
from app.models.company import Company
from app.models.roadmap import Roadmap, RoadmapCategory, RoadmapTopic
from app.schemas.analytics import (
    AnalyticsSummaryResponse,
    ProblemsAnalytics,
    ProblemDifficultyStats,
    ProblemPlatformStats,
    ProblemTopicStats,
    CompaniesAnalytics,
    CompanyFunnelStats,
    GoalsAnalytics,
    GoalTopicStatusBreakdown,
    CategoryProgressItem,
    ReadinessAnalytics,
    ActivityTrendItem,
    StudyDistributionItem,
)


class AnalyticsService:
    """Service class executing analytical aggregations against user datasets."""

    def __init__(self, session: AsyncSession):
        """Initialize service with an asynchronous database session.

        Args:
            session: SQLAlchemy AsyncSession for database operations.
        """
        self.session = session

    async def get_user_analytics(self, user_id: UUID) -> AnalyticsSummaryResponse:
        """Compute comprehensive placement preparation analytics for the authenticated user.

        Aggregates problems, company pipeline progress, roadmap goal completions,
        readiness indicators, and time-series study trends.

        Args:
            user_id: The UUID of the authenticated user.

        Returns:
            AnalyticsSummaryResponse containing all analytical dimensions.
        """
        problems_analytics = await self._get_problems_analytics(user_id)
        companies_analytics = await self._get_companies_analytics(user_id)
        goals_analytics, readiness_analytics, study_dist = await self._get_goals_and_readiness_analytics(user_id)
        activity_trends = await self._get_activity_trends(user_id)

        return AnalyticsSummaryResponse(
            problems=problems_analytics,
            companies=companies_analytics,
            goals=goals_analytics,
            readiness=readiness_analytics,
            activity_trends=activity_trends,
            study_distribution=study_dist
        )

    async def _get_problems_analytics(self, user_id: UUID) -> ProblemsAnalytics:
        """Aggregate problem solving metrics by difficulty, platform, and topic."""
        # 1. Total Problems Tracked
        total_stmt = select(func.count()).select_from(Problem).where(Problem.user_id == user_id)
        total_tracked = (await self.session.execute(total_stmt)).scalar() or 0

        # 2. Total Solved
        solved_stmt = select(func.count()).select_from(Problem).where(
            Problem.user_id == user_id,
            Problem.status == "solved"
        )
        total_solved = (await self.session.execute(solved_stmt)).scalar() or 0

        # 3. By Difficulty for solved problems
        diff_stmt = select(Problem.difficulty, func.count()).where(
            Problem.user_id == user_id,
            Problem.status == "solved"
        ).group_by(Problem.difficulty)
        diff_rows = (await self.session.execute(diff_stmt)).all()
        diff_dict = {str(row[0]).lower(): row[1] for row in diff_rows if row[0]}
        
        difficulty_stats = ProblemDifficultyStats(
            easy=diff_dict.get("easy", 0),
            medium=diff_dict.get("medium", 0),
            hard=diff_dict.get("hard", 0)
        )

        # 4. By Platform
        platform_stmt = select(Problem.platform, func.count()).where(
            Problem.user_id == user_id
        ).group_by(Problem.platform).order_by(desc(func.count()))
        platform_rows = (await self.session.execute(platform_stmt)).all()
        by_platform = [
            ProblemPlatformStats(platform=row[0] or "Other", count=row[1])
            for row in platform_rows
        ]

        # 5. By Topic (Top 10)
        topic_stmt = select(Problem.topic, func.count()).where(
            Problem.user_id == user_id,
            Problem.status == "solved"
        ).group_by(Problem.topic).order_by(desc(func.count())).limit(10)
        topic_rows = (await self.session.execute(topic_stmt)).all()
        by_topic = [
            ProblemTopicStats(topic=row[0] or "General", count=row[1])
            for row in topic_rows if row[0]
        ]

        return ProblemsAnalytics(
            total_solved=total_solved,
            total_tracked=total_tracked,
            by_difficulty=difficulty_stats,
            by_platform=by_platform,
            by_topic=by_topic
        )

    async def _get_companies_analytics(self, user_id: UUID) -> CompaniesAnalytics:
        """Aggregate company application funnel, roles, and recent pipeline events."""
        # 1. Total Tracked
        total_stmt = select(func.count()).select_from(Company).where(Company.user_id == user_id)
        total_tracked = (await self.session.execute(total_stmt)).scalar() or 0

        # 2. Funnel Stages
        status_stmt = select(Company.status, func.count()).where(
            Company.user_id == user_id
        ).group_by(Company.status)
        status_rows = (await self.session.execute(status_stmt)).all()
        status_dict = {str(row[0]).lower(): row[1] for row in status_rows if row[0]}

        funnel = CompanyFunnelStats(
            wishlist=status_dict.get("wishlist", 0),
            applied=status_dict.get("applied", 0),
            interviewing=status_dict.get("interviewing", 0),
            offered=status_dict.get("offered", 0),
            rejected=status_dict.get("rejected", 0)
        )

        # 3. By Role (Top 6)
        role_stmt = select(Company.role, func.count()).where(
            Company.user_id == user_id
        ).group_by(Company.role).order_by(desc(func.count())).limit(6)
        role_rows = (await self.session.execute(role_stmt)).all()
        by_role = {row[0] or "Software Engineer": row[1] for row in role_rows}

        # 4. Recent Applications (Top 5)
        recent_stmt = select(
            Company.name,
            Company.role,
            Company.status,
            Company.applied_date
        ).where(Company.user_id == user_id).order_by(desc(Company.created_at)).limit(5)
        recent_rows = (await self.session.execute(recent_stmt)).all()
        recent_apps = [
            {
                "name": row.name,
                "role": row.role,
                "status": row.status,
                "applied_date": row.applied_date.isoformat() if row.applied_date else None
            }
            for row in recent_rows
        ]

        return CompaniesAnalytics(
            total_tracked=total_tracked,
            funnel=funnel,
            by_role=by_role,
            recent_applications=recent_apps
        )

    async def _get_goals_and_readiness_analytics(
        self, user_id: UUID
    ) -> tuple[GoalsAnalytics, ReadinessAnalytics, List[StudyDistributionItem]]:
        """Compute goal progress, category distributions, and placement readiness index."""
        stmt = (
            select(Roadmap)
            .where(Roadmap.user_id == user_id)
            .options(
                selectinload(Roadmap.categories).selectinload(RoadmapCategory.topics)
            )
        )
        result = await self.session.execute(stmt)
        roadmaps = result.scalars().all()

        total_goals = len(roadmaps)
        active_goals = 0
        completed_goals = 0
        total_topics = 0
        completed_topics = 0
        remaining_hours = 0.0

        status_counts = {
            "not_started": 0,
            "bookmarked": 0,
            "in_progress": 0,
            "needs_revision": 0,
            "completed": 0,
            "mastered": 0,
            "skipped": 0,
        }

        category_map: Dict[str, Dict[str, Any]] = {}
        total_progress_sum = 0

        for r in roadmaps:
            if r.status == "active":
                active_goals += 1
            elif r.status == "completed":
                completed_goals += 1

            # Compute goal progress percentage
            g_total = 0
            g_completed = 0
            for cat in r.categories:
                cat_name = cat.name.strip()
                if cat_name not in category_map:
                    category_map[cat_name] = {
                        "name": cat_name,
                        "total": 0,
                        "completed": 0,
                        "remaining_hours": 0.0
                    }

                for t in cat.topics:
                    g_total += 1
                    total_topics += 1
                    t_status = t.status.lower() if t.status else "not_started"
                    
                    if t_status in status_counts:
                        status_counts[t_status] += 1
                    else:
                        status_counts["not_started"] += 1

                    category_map[cat_name]["total"] += 1

                    if t_status in ("completed", "mastered"):
                        g_completed += 1
                        completed_topics += 1
                        category_map[cat_name]["completed"] += 1
                    else:
                        hrs = float(t.estimated_hours or 0.0)
                        remaining_hours += hrs
                        category_map[cat_name]["remaining_hours"] += hrs

            if g_total > 0:
                g_prog = round((g_completed / g_total) * 100)
                total_progress_sum += g_prog
                if g_prog == 100 and r.status == "active":
                    completed_goals += 1

        average_progress = round(total_progress_sum / total_goals) if total_goals > 0 else 0
        pri = round((completed_topics / total_topics) * 100) if total_topics > 0 else 0

        # Build category breakdown
        category_progress: List[CategoryProgressItem] = []
        study_distribution: List[StudyDistributionItem] = []

        for cat_name, data in category_map.items():
            cat_total = data["total"]
            cat_comp = data["completed"]
            cat_pct = round((cat_comp / cat_total) * 100) if cat_total > 0 else 0
            
            category_progress.append(
                CategoryProgressItem(
                    name=cat_name,
                    completed_topics=cat_comp,
                    total_topics=cat_total,
                    percentage=cat_pct,
                    estimated_hours_remaining=round(data["remaining_hours"], 1)
                )
            )

            if data["remaining_hours"] > 0:
                study_distribution.append(
                    StudyDistributionItem(
                        category=cat_name,
                        estimated_hours_remaining=round(data["remaining_hours"], 1),
                        topics_count=cat_total - cat_comp
                    )
                )

        # Sort categories to derive strengths and improvement areas
        category_progress.sort(key=lambda x: x.percentage, reverse=True)
        strengths = [c.name for c in category_progress[:3] if c.percentage > 0]
        needs_improvement = [c.name for c in reversed(category_progress) if c.percentage < 100][:3]

        if not strengths:
            strengths = ["Foundations"]
        if not needs_improvement:
            needs_improvement = ["None (All Topics Optimized)"]

        # Calculate current streak
        streak = await self._calculate_current_streak(user_id)

        topic_status_breakdown = GoalTopicStatusBreakdown(
            not_started=status_counts["not_started"],
            bookmarked=status_counts["bookmarked"],
            in_progress=status_counts["in_progress"],
            needs_revision=status_counts["needs_revision"],
            completed=status_counts["completed"],
            mastered=status_counts["mastered"],
            skipped=status_counts["skipped"]
        )

        goals_analytics = GoalsAnalytics(
            total_goals=total_goals,
            active_goals=active_goals,
            completed_goals=completed_goals,
            average_progress=average_progress,
            total_topics=total_topics,
            completed_topics=completed_topics,
            topic_status_breakdown=topic_status_breakdown,
            category_progress=category_progress
        )

        readiness_analytics = ReadinessAnalytics(
            placement_readiness_index=pri,
            strengths=strengths,
            needs_improvement=needs_improvement,
            current_streak=streak,
            remaining_study_time=round(remaining_hours, 1)
        )

        return goals_analytics, readiness_analytics, study_distribution

    async def _calculate_current_streak(self, user_id: UUID) -> int:
        """Calculate continuous daily problem submission streak."""
        heatmap_stmt = (
            select(cast(Problem.created_at, Date))
            .where(
                Problem.user_id == user_id,
                Problem.status == "solved"
            )
            .group_by(cast(Problem.created_at, Date))
            .order_by(desc(cast(Problem.created_at, Date)))
        )
        dates = (await self.session.execute(heatmap_stmt)).scalars().all()
        
        if not dates:
            return 0

        today = date.today()
        yesterday = today - timedelta(days=1)
        
        if dates[0] != today and dates[0] != yesterday:
            return 0

        streak = 1
        check_date = dates[0]
        for d in dates[1:]:
            if d == check_date - timedelta(days=1):
                streak += 1
                check_date = d
            elif d == check_date:
                continue
            else:
                break

        return streak

    async def _get_activity_trends(self, user_id: UUID) -> List[ActivityTrendItem]:
        """Query problem completions for the past 14 days."""
        today = date.today()
        start_date = today - timedelta(days=13)

        stmt = (
            select(
                cast(Problem.created_at, Date).label("day"),
                func.count().label("cnt")
            )
            .where(
                Problem.user_id == user_id,
                Problem.status == "solved",
                cast(Problem.created_at, Date) >= start_date
            )
            .group_by(cast(Problem.created_at, Date))
        )
        rows = (await self.session.execute(stmt)).all()
        counts_by_date = {row.day: row.cnt for row in rows}

        trends: List[ActivityTrendItem] = []
        for i in range(14):
            day_cursor = start_date + timedelta(days=i)
            trends.append(
                ActivityTrendItem(
                    date=day_cursor.strftime("%Y-%m-%d"),
                    problems_solved=counts_by_date.get(day_cursor, 0)
                )
            )

        return trends
