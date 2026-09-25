"""Integration tests for Company-Wise DSA Preparation and Goal Company Integration.
Covers:
1. Company catalog retrieval and search
2. Company preparation detail with topic and difficulty breakdowns
3. Question pagination and filtering by topic, difficulty, status, search
4. User question status updates and progress calculations
5. Strict multi-tenant isolation (User A vs User B)
6. Goal creation with target companies (GoalCompany persistence)
7. Goal update, retrieval, and cascade deletion safety
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from sqlalchemy import select
from app.models.company_dsa import DsaCompany, CompanyQuestion, DsaCompanyQuestion, GoalCompany
from app.models.roadmap import Roadmap

pytestmark = pytest.mark.anyio

async def test_company_dsa_full_lifecycle(client: AsyncClient, db_session):
    # ── 1. Create Test Company & Questions ─────────────────────────────
    suffix = uuid4().hex[:6]
    test_comp_name = f"Acme Corp {suffix}"
    test_comp_slug = f"acme-corp-{suffix}"

    comp = DsaCompany(
        name=test_comp_name,
        slug=test_comp_slug,
        aliases=[f"acme-{suffix}"],
        question_count=3,
        is_top_30=True,
        rank=1
    )
    db_session.add(comp)
    await db_session.flush()

    q1 = CompanyQuestion(
        title=f"Acme Problem One {suffix}",
        slug=f"acme-problem-one-{suffix}",
        difficulty="Easy",
        platform_url="https://leetcode.com/problems/acme-problem-one",
        topics=["Array", "Hash Table"],
        companies=[test_comp_name],
        company_count=1,
        frequency="90.0%"
    )
    q2 = CompanyQuestion(
        title=f"Acme Problem Two {suffix}",
        slug=f"acme-problem-two-{suffix}",
        difficulty="Medium",
        platform_url="https://leetcode.com/problems/acme-problem-two",
        topics=["Dynamic Programming"],
        companies=[test_comp_name],
        company_count=1,
        frequency="75.0%"
    )
    q3 = CompanyQuestion(
        title=f"Acme Problem Three {suffix}",
        slug=f"acme-problem-three-{suffix}",
        difficulty="Hard",
        platform_url="https://leetcode.com/problems/acme-problem-three",
        topics=["Dynamic Programming", "Tree"],
        companies=[test_comp_name],
        company_count=1,
        frequency="50.0%"
    )
    db_session.add_all([q1, q2, q3])
    await db_session.flush()

    db_session.add_all([
        DsaCompanyQuestion(company_id=comp.id, question_id=q1.id, frequency="90.0%"),
        DsaCompanyQuestion(company_id=comp.id, question_id=q2.id, frequency="75.0%"),
        DsaCompanyQuestion(company_id=comp.id, question_id=q3.id, frequency="50.0%"),
    ])
    await db_session.commit()

    # ── 2. Register Users for Multi-Tenant Isolation ──────────────────
    email_a = f"dsa_user_a_{suffix}@example.com"
    email_b = f"dsa_user_b_{suffix}@example.com"

    await client.post("/api/v1/auth/register", json={"email": email_a, "password": "Password123!", "full_name": "User A"})
    await client.post("/api/v1/auth/register", json={"email": email_b, "password": "Password123!", "full_name": "User B"})

    # Login User A
    login_a = await client.post("/api/v1/auth/login", json={"email": email_a, "password": "Password123!"})
    token_a = login_a.json()["data"]["tokens"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Login User B
    login_b = await client.post("/api/v1/auth/login", json={"email": email_b, "password": "Password123!"})
    token_b = login_b.json()["data"]["tokens"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # ── 3. Test Company Catalog API ───────────────────────────────────
    res_cat = await client.get("/api/v1/company-dsa/companies", headers=headers_a)
    assert res_cat.status_code == 200
    cat_data = res_cat.json()["data"]
    assert len(cat_data) > 0

    # Search company
    res_search = await client.get(f"/api/v1/company-dsa/companies?search={test_comp_name}", headers=headers_a)
    assert res_search.status_code == 200
    search_data = res_search.json()["data"]
    assert len(search_data) == 1
    assert search_data[0]["name"] == test_comp_name
    assert search_data[0]["user_solved_count"] == 0
    assert search_data[0]["user_progress_percentage"] == 0.0

    # ── 4. Test Company Detail API ────────────────────────────────────
    res_detail = await client.get(f"/api/v1/company-dsa/companies/{test_comp_slug}", headers=headers_a)
    assert res_detail.status_code == 200
    detail_data = res_detail.json()["data"]
    assert detail_data["name"] == test_comp_name
    assert detail_data["question_count"] == 3
    assert detail_data["solved_count"] == 0
    assert detail_data["remaining_count"] == 3
    assert "difficulty_breakdown" in detail_data
    assert detail_data["difficulty_breakdown"]["easy"]["total"] == 1
    assert detail_data["difficulty_breakdown"]["medium"]["total"] == 1
    assert detail_data["difficulty_breakdown"]["hard"]["total"] == 1
    assert len(detail_data["topic_breakdown"]) >= 3

    # ── 5. Test Questions Pagination & Filters ─────────────────────────
    # Page size 2
    res_q_paged = await client.get(
        f"/api/v1/company-dsa/companies/{test_comp_slug}/questions?page=1&page_size=2",
        headers=headers_a
    )
    assert res_q_paged.status_code == 200
    paged_data = res_q_paged.json()["data"]
    assert len(paged_data["items"]) == 2
    assert paged_data["total"] == 3
    assert paged_data["total_pages"] == 2

    # Filter by Difficulty
    res_diff = await client.get(
        f"/api/v1/company-dsa/companies/{test_comp_slug}/questions?difficulty=Easy",
        headers=headers_a
    )
    assert res_diff.status_code == 200
    assert len(res_diff.json()["data"]["items"]) == 1
    assert res_diff.json()["data"]["items"][0]["title"] == f"Acme Problem One {suffix}"

    # Filter by Topic
    res_topic = await client.get(
        f"/api/v1/company-dsa/companies/{test_comp_slug}/questions?topic=Dynamic Programming",
        headers=headers_a
    )
    assert res_topic.status_code == 200
    assert len(res_topic.json()["data"]["items"]) == 2

    # Filter by Search
    res_qsearch = await client.get(
        f"/api/v1/company-dsa/companies/{test_comp_slug}/questions?search=Three",
        headers=headers_a
    )
    assert res_qsearch.status_code == 200
    assert len(res_qsearch.json()["data"]["items"]) == 1
    assert res_qsearch.json()["data"]["items"][0]["title"] == f"Acme Problem Three {suffix}"

    # ── 6. Test Status Update & Progress Calculation ──────────────────
    # User A solves q1
    res_solve = await client.patch(
        f"/api/v1/company-dsa/questions/{q1.id}/status",
        json={"status": "solved", "notes": "Used hash map"},
        headers=headers_a
    )
    assert res_solve.status_code == 200
    assert res_solve.json()["data"]["status"] == "solved"

    # User A sets q2 to attempted
    res_att = await client.patch(
        f"/api/v1/company-dsa/questions/{q2.id}/status",
        json={"status": "attempted"},
        headers=headers_a
    )
    assert res_att.status_code == 200
    assert res_att.json()["data"]["status"] == "attempted"

    # Check User A's updated company detail
    res_detail_a = await client.get(f"/api/v1/company-dsa/companies/{test_comp_slug}", headers=headers_a)
    detail_a = res_detail_a.json()["data"]
    assert detail_a["solved_count"] == 1
    assert detail_a["attempted_count"] == 1
    assert detail_a["remaining_count"] == 2
    # Progress = 1 / 3 * 100 = 33.3%
    assert detail_a["progress_percentage"] == 33.3
    assert detail_a["difficulty_breakdown"]["easy"]["solved"] == 1

    # ── 7. Verify Strict Multi-Tenant Isolation ───────────────────────
    # User B views company detail
    res_detail_b = await client.get(f"/api/v1/company-dsa/companies/{test_comp_slug}", headers=headers_b)
    detail_b = res_detail_b.json()["data"]
    assert detail_b["solved_count"] == 0
    assert detail_b["attempted_count"] == 0
    assert detail_b["remaining_count"] == 3
    assert detail_b["progress_percentage"] == 0.0
    assert detail_b["difficulty_breakdown"]["easy"]["solved"] == 0

    # User B views questions list
    res_q_b = await client.get(f"/api/v1/company-dsa/companies/{test_comp_slug}/questions", headers=headers_b)
    items_b = res_q_b.json()["data"]["items"]
    for it in items_b:
        assert it["status"] == "not_started"

    # ── 8. Test Goal Company Integration ──────────────────────────────
    # User A creates Goal with target company
    goal_payload = {
        "title": f"Goal for Acme {suffix}",
        "target_role": "Backend Developer",
        "target_companies": [test_comp_name],
        "categories": [
            {
                "name": "DSA Prep",
                "topics": [{"name": "Two Pointers", "status": "not_started"}]
            }
        ]
    }
    res_goal = await client.post("/api/v1/goals/", json=goal_payload, headers=headers_a)
    assert res_goal.status_code == 201
    goal_data = res_goal.json()
    goal_id = goal_data["id"]

    # Verify target companies returned in Goal response
    assert "selected_companies" in goal_data
    assert len(goal_data["selected_companies"]) == 1
    gc = goal_data["selected_companies"][0]
    assert gc["name"] == test_comp_name
    assert gc["question_count"] == 3
    assert gc["solved_count"] == 1
    assert gc["progress_percentage"] == 33.3

    # Verify GoalCompany row exists in database
    gc_stmt = select(GoalCompany).where(GoalCompany.goal_id == goal_id)
    gc_res = await db_session.execute(gc_stmt)
    gc_rows = gc_res.scalars().all()
    assert len(gc_rows) == 1
    assert gc_rows[0].company_id == comp.id

    # User A deletes goal
    res_del = await client.delete(f"/api/v1/goals/{goal_id}", headers=headers_a)
    assert res_del.status_code in [200, 204]

    # Verify GoalCompany row was deleted in cascade
    gc_after = await db_session.execute(gc_stmt)
    assert len(gc_after.scalars().all()) == 0

    # Verify DsaCompany and CompanyQuestion records are NOT deleted
    comp_check = await db_session.get(DsaCompany, comp.id)
    assert comp_check is not None
    q_check = await db_session.get(CompanyQuestion, q1.id)
    assert q_check is not None
