import math
from typing import List, Optional, Tuple, Dict, Any
from uuid import UUID
from sqlalchemy import select, or_, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company_question import CompanyQuestion, UserQuestionProgress
from app.models.problem import Problem
from app.schemas.company_question import (
    CompanyQuestionResponse,
    CompanyPreparationStats,
    TopicPreparationBreakdown,
    CompanyPreparationResponse
)

class CompanyQuestionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, question_id: UUID) -> Optional[CompanyQuestion]:
        """Fetch a company question by UUID."""
        return await self.session.get(CompanyQuestion, question_id)

    async def upsert_user_progress(
        self,
        user_id: UUID,
        question_id: UUID,
        status: str,
        notes: Optional[str] = None
    ) -> UserQuestionProgress:
        """Upsert user-specific progress for a company question and keep Problem Tracker in sync."""
        stmt = select(UserQuestionProgress).where(
            UserQuestionProgress.user_id == user_id,
            UserQuestionProgress.question_id == question_id
        )
        res = await self.session.execute(stmt)
        progress = res.scalar_one_or_none()

        if progress:
            progress.status = status
            if notes is not None:
                progress.notes = notes
        else:
            progress = UserQuestionProgress(
                user_id=user_id,
                question_id=question_id,
                status=status,
                notes=notes
            )
            self.session.add(progress)

        # Synchronize with Problems Tracker if user marked it solved or attempted
        question = await self.get_by_id(question_id)
        if question:
            # Check if problem already exists in Problem Tracker
            prob_stmt = select(Problem).where(
                Problem.user_id == user_id,
                func.lower(Problem.title) == func.lower(question.title)
            )
            prob_res = await self.session.execute(prob_stmt)
            existing_prob = prob_res.scalar_one_or_none()

            primary_topic = question.topics[0] if question.topics else "DSA"
            if existing_prob:
                existing_prob.status = status
                if notes:
                    existing_prob.notes = notes
            elif status in ["solved", "attempted"]:
                new_prob = Problem(
                    user_id=user_id,
                    title=question.title,
                    platform="leetcode",
                    platform_url=question.platform_url,
                    topic=primary_topic,
                    difficulty=question.difficulty.lower(),
                    status=status,
                    notes=notes
                )
                self.session.add(new_prob)

        await self.session.commit()
        await self.session.refresh(progress)
        return progress

    async def get_company_preparation(
        self,
        goal_id: UUID,
        goal_title: str,
        target_companies: List[str],
        user_id: UUID,
        company_filter: Optional[str] = None,
        topic_filter: Optional[str] = None,
        difficulty_filter: Optional[str] = None,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 500
    ) -> CompanyPreparationResponse:
        """Fetch deduplicated questions and real mathematical preparation progress for a goal's target companies."""
        if not target_companies:
            return CompanyPreparationResponse(
                goal_id=goal_id,
                goal_title=goal_title,
                target_companies=[],
                overall_progress_percentage=0.0,
                total_unique_questions=0,
                solved_unique_questions=0,
                company_stats=[],
                topic_breakdown=[],
                questions=[]
            )

        # 1. Base query for all questions associated with any of the target companies
        conditions = [CompanyQuestion.companies.contains([c]) for c in target_companies]
        base_stmt = select(CompanyQuestion).where(or_(*conditions))
        base_res = await self.session.execute(base_stmt)
        all_goal_questions = base_res.scalars().all()

        # 2. Fetch user's progress records for all these questions
        q_ids = [q.id for q in all_goal_questions]
        user_progress_map: Dict[UUID, Tuple[str, Optional[str]]] = {}
        if q_ids:
            prog_stmt = select(UserQuestionProgress).where(
                UserQuestionProgress.user_id == user_id,
                UserQuestionProgress.question_id.in_(q_ids)
            )
            prog_res = await self.session.execute(prog_stmt)
            for p in prog_res.scalars().all():
                user_progress_map[p.question_id] = (p.status, p.notes)

        # Also cross-check with user's Problem tracker by title so prior solves count
        prob_stmt = select(Problem.title, Problem.status).where(Problem.user_id == user_id)
        prob_res = await self.session.execute(prob_stmt)
        solved_problem_titles = {row[0].lower().strip() for row in prob_res.all() if row[1] == 'solved'}

        # Build map of final question statuses for this user
        final_status_map: Dict[UUID, Tuple[str, Optional[str]]] = {}
        for q in all_goal_questions:
            if q.id in user_progress_map:
                final_status_map[q.id] = user_progress_map[q.id]
            elif q.title.lower().strip() in solved_problem_titles:
                final_status_map[q.id] = ('solved', None)
            else:
                final_status_map[q.id] = ('not_started', None)

        # 3. Calculate per-company statistics (Real progress, zero mock)
        company_stats: List[CompanyPreparationStats] = []
        for c in target_companies:
            c_questions = [q for q in all_goal_questions if c in q.companies]
            total_q = len(c_questions)
            solved_q = sum(1 for q in c_questions if final_status_map.get(q.id, ('not_started', None))[0] == 'solved')
            pct = round((solved_q / total_q * 100.0), 1) if total_q > 0 else 0.0

            # Topics covered for this company
            all_c_topics = set()
            covered_c_topics = set()
            for q in c_questions:
                is_solved = final_status_map.get(q.id, ('not_started', None))[0] == 'solved'
                for t in (q.topics or []):
                    all_c_topics.add(t)
                    if is_solved:
                        covered_c_topics.add(t)

            company_stats.append(CompanyPreparationStats(
                company_name=c,
                total_questions=total_q,
                solved_questions=solved_q,
                progress_percentage=pct,
                topics_covered=len(covered_c_topics),
                total_topics=len(all_c_topics)
            ))

        # 4. Calculate Topic Breakdown for the goal
        topic_totals: Dict[str, int] = {}
        topic_solved: Dict[str, int] = {}
        for q in all_goal_questions:
            is_solved = final_status_map.get(q.id, ('not_started', None))[0] == 'solved'
            for t in (q.topics or []):
                topic_totals[t] = topic_totals.get(t, 0) + 1
                if is_solved:
                    topic_solved[t] = topic_solved.get(t, 0) + 1

        topic_breakdown: List[TopicPreparationBreakdown] = [
            TopicPreparationBreakdown(
                topic_name=t,
                total_questions=topic_totals[t],
                solved_questions=topic_solved.get(t, 0)
            )
            for t in sorted(topic_totals.keys(), key=lambda x: -topic_totals[x])
        ]

        # 5. Apply filters for the question list returned to user
        filtered_questions = all_goal_questions

        if company_filter and company_filter.lower() != 'all':
            filtered_questions = [q for q in filtered_questions if company_filter in q.companies]

        if topic_filter and topic_filter.lower() != 'all':
            filtered_questions = [q for q in filtered_questions if topic_filter in (q.topics or [])]

        if difficulty_filter and difficulty_filter.lower() != 'all':
            filtered_questions = [q for q in filtered_questions if q.difficulty.lower() == difficulty_filter.lower()]

        if search:
            s_low = search.lower().strip()
            filtered_questions = [q for q in filtered_questions if s_low in q.title.lower()]

        if status_filter and status_filter.lower() != 'all':
            filtered_questions = [
                q for q in filtered_questions
                if final_status_map.get(q.id, ('not_started', None))[0] == status_filter.lower()
            ]

        # Sort: company_count desc, then title asc
        filtered_questions.sort(key=lambda x: (-x.company_count, x.title))

        # Paginate
        paginated = filtered_questions[skip : skip + limit]

        question_responses: List[CompanyQuestionResponse] = []
        for q in paginated:
            st, notes = final_status_map.get(q.id, ('not_started', None))
            # Filter the company list on each question to show which of the GOAL's target companies ask it
            target_asking = [c for c in q.companies if c in target_companies]
            question_responses.append(CompanyQuestionResponse(
                id=q.id,
                title=q.title,
                slug=q.slug,
                difficulty=q.difficulty,
                platform_url=q.platform_url,
                topics=q.topics or [],
                companies=target_asking if target_asking else q.companies,
                company_count=len(target_asking) if target_asking else q.company_count,
                acceptance_rate=q.acceptance_rate,
                frequency=q.frequency,
                status=st,
                user_notes=notes
            ))

        total_unique = len(all_goal_questions)
        total_solved = sum(1 for q in all_goal_questions if final_status_map.get(q.id, ('not_started', None))[0] == 'solved')
        overall_pct = round((total_solved / total_unique * 100.0), 1) if total_unique > 0 else 0.0

        return CompanyPreparationResponse(
            goal_id=goal_id,
            goal_title=goal_title,
            target_companies=target_companies,
            overall_progress_percentage=overall_pct,
            total_unique_questions=total_unique,
            solved_unique_questions=total_solved,
            company_stats=company_stats,
            topic_breakdown=topic_breakdown[:15], # Top 15 topics
            questions=question_responses
        )
