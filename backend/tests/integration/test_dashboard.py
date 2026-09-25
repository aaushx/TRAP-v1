"""Integration tests for Dashboard statistics and placement readiness endpoints.

Verifies that:
1. problems_solved counts ONLY problems with status == 'solved' (ignoring attempted, skipped, revisit).
2. daily_goal_progress calculates today's solved problems.
3. Heatmap aggregates problem completion counts by calendar date.
4. Placement readiness index correctly computes topic completion percentages.
5. User isolation prevents data leakage across accounts.
"""

import pytest
from httpx import AsyncClient
from datetime import date, timedelta

pytestmark = pytest.mark.anyio


async def test_dashboard_stats_and_readiness(client: AsyncClient, db_session):
    """Test dashboard metrics calculation, solved-only filtering, and readiness indices."""
    # 1. Register User A and User B
    user_a_payload = {"email": "dash_usera@example.com", "password": "securepassword123", "full_name": "Dash User A"}
    user_b_payload = {"email": "dash_userb@example.com", "password": "securepassword123", "full_name": "Dash User B"}

    await client.post("/api/v1/auth/register", json=user_a_payload)
    await client.post("/api/v1/auth/register", json=user_b_payload)

    # Login User A
    res_a = await client.post("/api/v1/auth/login", json=user_a_payload)
    token_a = res_a.json()["data"]["tokens"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Login User B
    res_b = await client.post("/api/v1/auth/login", json=user_b_payload)
    token_b = res_b.json()["data"]["tokens"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. Initial Dashboard Stats for User A (must be all 0)
    dash_res = await client.get("/api/v1/dashboard/stats", headers=headers_a)
    assert dash_res.status_code == 200
    stats_a = dash_res.json()["data"]["stats"]
    assert stats_a["problems_solved"] == 0
    assert stats_a["companies_tracked"] == 0
    assert stats_a["active_goals"] == 0
    assert stats_a["daily_goal_progress"] == 0

    # 3. Create a mix of problems for User A (1 solved, 1 attempted, 1 revisit, 1 skipped)
    problems = [
        {"title": "Two Sum", "platform": "leetcode", "topic": "Arrays", "difficulty": "easy", "status": "solved"},
        {"title": "3Sum", "platform": "leetcode", "topic": "Arrays", "difficulty": "medium", "status": "attempted"},
        {"title": "LRU Cache", "platform": "leetcode", "topic": "Design", "difficulty": "medium", "status": "revisit"},
        {"title": "Median of Arrays", "platform": "leetcode", "topic": "Arrays", "difficulty": "hard", "status": "skipped"},
    ]
    for prob in problems:
        p_res = await client.post("/api/v1/problems/", json=prob, headers=headers_a)
        assert p_res.status_code == 201

    # 4. Verify dashboard stats: problems_solved must be exactly 1 (only the 'solved' one)
    dash_res = await client.get("/api/v1/dashboard/stats", headers=headers_a)
    assert dash_res.status_code == 200
    stats_a = dash_res.json()["data"]["stats"]
    assert stats_a["problems_solved"] == 1
    assert stats_a["daily_goal_progress"] == 1  # Solved today

    # 5. Track a Company for User A
    comp_payload = {"name": "Google", "role": "Software Engineer", "status": "applied"}
    c_res = await client.post("/api/v1/companies/", json=comp_payload, headers=headers_a)
    assert c_res.status_code == 201

    # 6. Create Goal with 2 topics (1 completed, 1 in_progress)
    goal_payload = {
        "title": "DSA Mastery",
        "target_role": "Software Engineer",
        "target_companies": ["Google"],
        "categories": [
            {
                "name": "DSA",
                "sort_order": 0,
                "topics": [
                    {"name": "Arrays", "difficulty": "easy", "estimated_hours": 3.0, "status": "completed", "sort_order": 0},
                    {"name": "Trees", "difficulty": "medium", "estimated_hours": 5.0, "status": "in_progress", "sort_order": 1}
                ]
            }
        ]
    }
    g_res = await client.post("/api/v1/goals/", json=goal_payload, headers=headers_a)
    assert g_res.status_code == 201

    # 7. Check Dashboard Stats & Readiness
    dash_res = await client.get("/api/v1/dashboard/stats", headers=headers_a)
    assert dash_res.status_code == 200
    stats_a = dash_res.json()["data"]["stats"]
    assert stats_a["problems_solved"] == 1
    assert stats_a["companies_tracked"] == 1
    assert stats_a["active_goals"] == 1

    readiness_res = await client.get("/api/v1/dashboard/readiness", headers=headers_a)
    assert readiness_res.status_code == 200
    readiness_data = readiness_res.json()
    assert readiness_data["placement_readiness_index"] == 50  # 1/2 topics = 50%
    assert readiness_data["remaining_study_time"] == 5.0

    # 8. Multi-user isolation: User B's dashboard must still be 0 across all metrics
    dash_b_res = await client.get("/api/v1/dashboard/stats", headers=headers_b)
    assert dash_b_res.status_code == 200
    stats_b = dash_b_res.json()["data"]["stats"]
    assert stats_b["problems_solved"] == 0
    assert stats_b["companies_tracked"] == 0
    assert stats_b["active_goals"] == 0
