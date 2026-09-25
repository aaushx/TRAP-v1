import math
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from sqlalchemy import select, or_, and_, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company_dsa import DsaCompany, CompanyQuestion, DsaCompanyQuestion, UserQuestionProgress, GoalCompany
from app.models.problem import Problem
from app.schemas.company_dsa import (
    CompanyDsaListItem,
    CompanyDsaDetail,
    CompanyDsaQuestionItem,
    PaginatedQuestionsResponse,
    DifficultyStat,
    TopicStat,
    GoalCompanyItem
)

class CompanyDsaRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_companies_catalog(
        self,
        user_id: UUID,
        search: Optional[str] = None,
        filter_mode: Optional[str] = "all"
    ) -> List[CompanyDsaListItem]:
        """Fetch all companies with real question counts and authenticated user's progress."""
        # 1. Base query for companies
        stmt = select(DsaCompany)
        if search:
            s_clean = search.strip().lower()
            stmt = stmt.where(
                or_(
                    func.lower(DsaCompany.name).contains(s_clean),
                    func.lower(DsaCompany.slug).contains(s_clean)
                )
            )

        res = await self.session.execute(stmt)
        companies = res.scalars().all()

        # 2. Fetch solved question IDs for this user
        solved_stmt = select(UserQuestionProgress.question_id).where(
            UserQuestionProgress.user_id == user_id,
            UserQuestionProgress.status == "solved"
        )
        solved_res = await self.session.execute(solved_stmt)
        solved_q_ids = set(solved_res.scalars().all())

        # Also cross-reference user's solved problems by title
        prob_stmt = select(Problem.title).where(
            Problem.user_id == user_id,
            Problem.status == "solved"
        )
        prob_res = await self.session.execute(prob_stmt)
        solved_prob_titles = {row[0].lower().strip() for row in prob_res.all()}

        # 3. Build company-question map to count user's solved per company
        link_stmt = select(DsaCompanyQuestion.company_id, DsaCompanyQuestion.question_id)
        link_res = await self.session.execute(link_stmt)
        company_to_questions: Dict[UUID, List[UUID]] = {}
        for c_id, q_id in link_res.all():
            company_to_questions.setdefault(c_id, []).append(q_id)

        items: List[CompanyDsaListItem] = []
        for c in companies:
            q_ids = company_to_questions.get(c.id, [])
            total_q = c.question_count or len(q_ids)
            solved_count = sum(1 for qid in q_ids if qid in solved_q_ids)
            rem_count = max(0, total_q - solved_count)
            pct = round((solved_count / total_q * 100.0), 1) if total_q > 0 else 0.0

            items.append(CompanyDsaListItem(
                id=c.id,
                name=c.name,
                slug=c.slug,
                aliases=c.aliases or [],
                question_count=total_q,
                is_top_30=c.is_top_30,
                rank=c.rank,
                user_solved_count=solved_count,
                remaining_count=rem_count,
                user_progress_percentage=pct,
                official_domain=c.official_domain,
                logo_provider=c.logo_provider or "logo.dev",
                logo_status=c.logo_status or "UNVERIFIED"
            ))

        # 4. Apply filter_mode sorting / filtering
        mode = (filter_mode or "all").lower()
        if mode == "most_targeted":
            items.sort(key=lambda x: (not x.is_top_30, x.rank or 999, -x.question_count))
        elif mode == "most_questions":
            items.sort(key=lambda x: -x.question_count)
        elif mode == "alphabetical":
            items.sort(key=lambda x: x.name.lower())
        elif mode == "prepared":
            items = [i for i in items if i.user_solved_count > 0]
            items.sort(key=lambda x: -x.user_progress_percentage)
        elif mode == "not_started":
            items = [i for i in items if i.user_solved_count == 0]
            items.sort(key=lambda x: -x.question_count)
        else:
            # Default: Top 30 first by rank, then question volume
            items.sort(key=lambda x: (not x.is_top_30, x.rank or 999, -x.question_count))

        return items

    async def get_company_by_slug(self, slug_or_name: str) -> Optional[DsaCompany]:
        """Resolve company by slug or name."""
        s = slug_or_name.strip().lower()
        stmt = select(DsaCompany).where(
            or_(
                func.lower(DsaCompany.slug) == s,
                func.lower(DsaCompany.name) == s
            )
        )
        res = await self.session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_company_detail(self, company: DsaCompany, user_id: UUID) -> CompanyDsaDetail:
        """Calculate full overview statistics for a company."""
        # 1. Fetch all questions for this company
        stmt = (
            select(CompanyQuestion)
            .join(DsaCompanyQuestion, DsaCompanyQuestion.question_id == CompanyQuestion.id)
            .where(DsaCompanyQuestion.company_id == company.id)
        )
        res = await self.session.execute(stmt)
        questions = res.scalars().all()

        q_ids = [q.id for q in questions]

        # 2. Fetch user progress for these questions
        user_progress_map: Dict[UUID, Tuple[str, Optional[str]]] = {}
        if q_ids:
            prog_stmt = select(UserQuestionProgress).where(
                UserQuestionProgress.user_id == user_id,
                UserQuestionProgress.question_id.in_(q_ids)
            )
            prog_res = await self.session.execute(prog_stmt)
            for p in prog_res.scalars().all():
                user_progress_map[p.question_id] = (p.status, p.notes)

        # Cross-reference user's solved problems in Problems tracker
        prob_stmt = select(Problem.title).where(
            Problem.user_id == user_id,
            Problem.status == "solved"
        )
        prob_res = await self.session.execute(prob_stmt)
        solved_prob_titles = {row[0].lower().strip() for row in prob_res.all()}

        solved_count = 0
        attempted_count = 0
        needs_revision_count = 0

        diff_map: Dict[str, Dict[str, int]] = {
            "easy": {"total": 0, "solved": 0},
            "medium": {"total": 0, "solved": 0},
            "hard": {"total": 0, "solved": 0}
        }
        topic_totals: Dict[str, int] = {}
        topic_solved: Dict[str, int] = {}

        for q in questions:
            st, _ = user_progress_map.get(q.id, (None, None))
            if not st and q.title.lower().strip() in solved_prob_titles:
                st = "solved"
            st = st or "not_started"

            is_solved = (st == "solved")
            if is_solved:
                solved_count += 1
            elif st == "attempted":
                attempted_count += 1
            elif st == "needs_revision":
                needs_revision_count += 1

            diff_key = q.difficulty.lower() if q.difficulty else "medium"
            if diff_key in diff_map:
                diff_map[diff_key]["total"] += 1
                if is_solved:
                    diff_map[diff_key]["solved"] += 1

            for t in (q.topics or []):
                topic_totals[t] = topic_totals.get(t, 0) + 1
                if is_solved:
                    topic_solved[t] = topic_solved.get(t, 0) + 1

        total_q = len(questions)
        rem_count = max(0, total_q - solved_count)
        pct = round((solved_count / total_q * 100.0), 1) if total_q > 0 else 0.0

        topic_stats = [
            TopicStat(
                topic=t,
                total=topic_totals[t],
                solved=topic_solved.get(t, 0),
                progress=round((topic_solved.get(t, 0) / topic_totals[t] * 100.0), 1) if topic_totals[t] > 0 else 0.0
            )
            for t in sorted(topic_totals.keys(), key=lambda x: -topic_totals[x])
        ]

        return CompanyDsaDetail(
            id=company.id,
            name=company.name,
            slug=company.slug,
            question_count=total_q,
            solved_count=solved_count,
            attempted_count=attempted_count,
            needs_revision_count=needs_revision_count,
            remaining_count=rem_count,
            progress_percentage=pct,
            difficulty_breakdown={
                k: DifficultyStat(total=v["total"], solved=v["solved"])
                for k, v in diff_map.items()
            },
            topic_breakdown=topic_stats,
            official_domain=company.official_domain,
            logo_provider=company.logo_provider or "logo.dev",
            logo_status=company.logo_status or "UNVERIFIED"
        )

    async def get_company_questions(
        self,
        company_id: UUID,
        user_id: UUID,
        topic: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        time_period: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: Optional[str] = "frequency",
        page: int = 1,
        page_size: int = 20
    ) -> PaginatedQuestionsResponse:
        """Fetch paginated questions for a company with filters, time period, and user status."""
        stmt = (
            select(CompanyQuestion, DsaCompanyQuestion.frequency, DsaCompanyQuestion.time_periods)
            .join(DsaCompanyQuestion, DsaCompanyQuestion.question_id == CompanyQuestion.id)
            .where(DsaCompanyQuestion.company_id == company_id)
        )

        if difficulty and difficulty.lower() != "all":
            stmt = stmt.where(func.lower(CompanyQuestion.difficulty) == difficulty.lower())

        if topic and topic.lower() != "all":
            stmt = stmt.where(CompanyQuestion.topics.contains([topic]))

        if time_period and time_period.lower() != "all":
            clean_tp = time_period.lower().replace("-", "_")
            stmt = stmt.where(DsaCompanyQuestion.time_periods.contains([clean_tp]))

        if search:
            s_clean = search.strip().lower()
            stmt = stmt.where(func.lower(CompanyQuestion.title).contains(s_clean))

        res = await self.session.execute(stmt)
        rows = res.all()

        # Fetch progress for all matching questions for this user
        q_ids = [r[0].id for r in rows]
        user_prog: Dict[UUID, Tuple[str, Optional[str]]] = {}
        if q_ids:
            prog_stmt = select(UserQuestionProgress).where(
                UserQuestionProgress.user_id == user_id,
                UserQuestionProgress.question_id.in_(q_ids)
            )
            prog_res = await self.session.execute(prog_stmt)
            for p in prog_res.scalars().all():
                user_prog[p.question_id] = (p.status, p.notes)

        # Cross-reference Problems tracker
        prob_stmt = select(Problem.title).where(
            Problem.user_id == user_id,
            Problem.status == "solved"
        )
        prob_res = await self.session.execute(prob_stmt)
        solved_titles = {row[0].lower().strip() for row in prob_res.all()}

        filtered_items: List[CompanyDsaQuestionItem] = []
        for q, freq, time_periods in rows:
            st, notes = user_prog.get(q.id, (None, None))
            if not st and q.title.lower().strip() in solved_titles:
                st = "solved"
            st = st or "not_started"

            if status and status.lower() != "all" and st != status.lower():
                continue

            filtered_items.append(CompanyDsaQuestionItem(
                id=q.id,
                external_id=q.external_id,
                title=q.title,
                slug=q.slug,
                difficulty=q.difficulty,
                platform_url=q.platform_url,
                topics=q.topics or [],
                frequency=freq or q.frequency,
                time_periods=time_periods or [],
                companies=q.companies or [],
                status=st,
                notes=notes
            ))

        # Sort items
        sort_mode = (sort_by or "frequency").lower()
        if sort_mode == "title":
            filtered_items.sort(key=lambda x: x.title.lower())
        elif sort_mode == "difficulty":
            diff_order = {"easy": 1, "medium": 2, "hard": 3}
            filtered_items.sort(key=lambda x: diff_order.get(x.difficulty.lower(), 2))
        else:
            def parse_freq(f_str: Optional[str]) -> float:
                if not f_str:
                    return 0.0
                clean = f_str.replace("%", "").strip()
                try:
                    return float(clean)
                except ValueError:
                    return 0.0
            filtered_items.sort(key=lambda x: -parse_freq(x.frequency))

        total_count = len(filtered_items)
        total_pages = max(1, math.ceil(total_count / page_size))
        current_page = max(1, min(page, total_pages))
        start_idx = (current_page - 1) * page_size
        end_idx = start_idx + page_size
        paged_items = filtered_items[start_idx:end_idx]

        return PaginatedQuestionsResponse(
            items=paged_items,
            total=total_count,
            page=current_page,
            page_size=page_size,
            total_pages=total_pages
        )

    async def get_question_by_id(self, question_id: UUID, user_id: UUID) -> Optional[CompanyQuestion]:
        """Fetch canonical question entity by ID."""
        return await self.session.get(CompanyQuestion, question_id)

    async def get_question_user_progress(self, question_id: UUID, user_id: UUID) -> Tuple[str, Optional[str]]:
        """Fetch user status and notes for a specific question."""
        stmt = select(UserQuestionProgress).where(
            UserQuestionProgress.user_id == user_id,
            UserQuestionProgress.question_id == question_id
        )
        res = await self.session.execute(stmt)
        prog = res.scalar_one_or_none()
        if prog:
            return prog.status, prog.notes
        return "not_started", None

    async def update_question_status(
        self,
        user_id: UUID,
        question_id: UUID,
        status: str,
        notes: Optional[str] = None
    ) -> UserQuestionProgress:
        """Update authenticated user's question progress and sync with Problems Tracker."""
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

        # Synchronize with Problems Tracker
        q = await self.session.get(CompanyQuestion, question_id)
        if q:
            prob_stmt = select(Problem).where(
                Problem.user_id == user_id,
                func.lower(Problem.title) == func.lower(q.title)
            )
            prob_res = await self.session.execute(prob_stmt)
            existing_prob = prob_res.scalar_one_or_none()

            primary_topic = q.topics[0] if q.topics else "DSA"
            if existing_prob:
                existing_prob.status = status
                if notes is not None:
                    existing_prob.notes = notes
            elif status in ["solved", "attempted"]:
                new_prob = Problem(
                    user_id=user_id,
                    title=q.title,
                    platform="leetcode",
                    platform_url=q.platform_url,
                    topic=primary_topic,
                    difficulty=q.difficulty.lower(),
                    status=status,
                    notes=notes
                )
                self.session.add(new_prob)

        await self.session.commit()
        await self.session.refresh(progress)
        return progress

    async def get_goal_companies(self, goal_id: UUID, user_id: UUID) -> List[GoalCompanyItem]:
        """Fetch target companies for a goal with calculated progress metrics."""
        stmt = (
            select(DsaCompany)
            .join(GoalCompany, GoalCompany.company_id == DsaCompany.id)
            .where(GoalCompany.goal_id == goal_id)
        )
        res = await self.session.execute(stmt)
        companies = res.scalars().all()

        # Solved questions by this user
        solved_stmt = select(UserQuestionProgress.question_id).where(
            UserQuestionProgress.user_id == user_id,
            UserQuestionProgress.status == "solved"
        )
        solved_res = await self.session.execute(solved_stmt)
        solved_ids = set(solved_res.scalars().all())

        link_stmt = select(DsaCompanyQuestion.company_id, DsaCompanyQuestion.question_id).where(
            DsaCompanyQuestion.company_id.in_([c.id for c in companies])
        )
        link_res = await self.session.execute(link_stmt)
        comp_q_map: Dict[UUID, List[UUID]] = {}
        for c_id, q_id in link_res.all():
            comp_q_map.setdefault(c_id, []).append(q_id)

        items: List[GoalCompanyItem] = []
        for c in companies:
            q_ids = comp_q_map.get(c.id, [])
            total_q = c.question_count or len(q_ids)
            solved_c = sum(1 for qid in q_ids if qid in solved_ids)
            rem_c = max(0, total_q - solved_c)
            pct = round((solved_c / total_q * 100.0), 1) if total_q > 0 else 0.0

            items.append(GoalCompanyItem(
                company_id=c.id,
                name=c.name,
                slug=c.slug,
                question_count=total_q,
                solved_count=solved_c,
                remaining_count=rem_c,
                progress_percentage=pct
            ))

        return items

    async def sync_goal_companies(self, goal_id: UUID, company_identifiers: List[str]):
        """Persist target companies into goal_companies table for a goal."""
        # 1. Delete existing associations
        del_stmt = delete(GoalCompany).where(GoalCompany.goal_id == goal_id)
        await self.session.execute(del_stmt)

        # 2. Resolve companies
        if not company_identifiers:
            await self.session.commit()
            return

        for ident in company_identifiers:
            c = await self.get_company_by_slug(ident)
            if c:
                assoc = GoalCompany(
                    goal_id=goal_id,
                    company_id=c.id
                )
                self.session.add(assoc)

        await self.session.commit()
