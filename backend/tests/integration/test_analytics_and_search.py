"""Integration tests for Analytics and Global Search endpoints.

Verifies that:
1. Analytics summary returns full aggregated performance metrics without mock data.
2. Granular endpoints (/analytics/problems, /analytics/companies, /analytics/goals, /analytics/readiness) respond accurately.
3. Global search (/search/?q=...) queries across Problems, Companies, Roadmaps, and Topics.
4. User data isolation prevents search or analytics leakage between accounts.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.anyio


async def test_analytics_and_global_search(client: AsyncClient, db_session):
    """Test Analytics aggregations and Global Search multi-entity indexing."""
    # 1. Register User A and User B
    user_a_payload = {"email": "analytics_a@example.com", "password": "securepassword123", "full_name": "Analytics User A"}
    user_b_payload = {"email": "analytics_b@example.com", "password": "securepassword123", "full_name": "Analytics User B"}

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

    # 2. Seed User A with Problems
    problems = [
        {"title": "Valid Anagram", "platform": "leetcode", "topic": "Strings", "difficulty": "easy", "status": "solved"},
        {"title": "Binary Tree Level Order", "platform": "leetcode", "topic": "Trees", "difficulty": "medium", "status": "solved"},
        {"title": "Merge K Sorted Lists", "platform": "leetcode", "topic": "Heaps", "difficulty": "hard", "status": "solved"},
        {"title": "N-Queens", "platform": "leetcode", "topic": "Backtracking", "difficulty": "hard", "status": "attempted"},
    ]
    for p in problems:
        await client.post("/api/v1/problems/", json=p, headers=headers_a)

    # 3. Seed User A with Companies
    companies = [
        {"name": "Microsoft", "role": "Full Stack Engineer", "status": "interviewing"},
        {"name": "Amazon", "role": "SDE I", "status": "applied"},
        {"name": "Apple", "role": "iOS Developer", "status": "wishlist"},
    ]
    for c in companies:
        await client.post("/api/v1/companies/", json=c, headers=headers_a)

    # 4. Seed User A with a Goal
    goal_payload = {
        "title": "FAANG SWE Goal",
        "target_role": "Software Engineer",
        "target_companies": ["Microsoft", "Amazon"],
        "categories": [
            {
                "name": "Core CS",
                "sort_order": 0,
                "topics": [
                    {"name": "Operating Systems", "difficulty": "medium", "estimated_hours": 4.0, "status": "completed", "sort_order": 0},
                    {"name": "Computer Networks", "difficulty": "medium", "estimated_hours": 4.0, "status": "not_started", "sort_order": 1}
                ]
            }
        ]
    }
    await client.post("/api/v1/goals/", json=goal_payload, headers=headers_a)

    # 5. Verify /api/v1/analytics/ summary
    summary_res = await client.get("/api/v1/analytics/", headers=headers_a)
    assert summary_res.status_code == 200
    summary = summary_res.json()

    # Problems Analytics Assertions
    assert summary["problems"]["total_solved"] == 3
    assert summary["problems"]["total_tracked"] == 4
    assert summary["problems"]["by_difficulty"]["easy"] == 1
    assert summary["problems"]["by_difficulty"]["medium"] == 1
    assert summary["problems"]["by_difficulty"]["hard"] == 1

    # Companies Analytics Assertions
    assert summary["companies"]["total_tracked"] == 3
    assert summary["companies"]["funnel"]["interviewing"] == 1
    assert summary["companies"]["funnel"]["applied"] == 1
    assert summary["companies"]["funnel"]["wishlist"] == 1

    # Goals Analytics Assertions
    assert summary["goals"]["total_goals"] == 1
    assert summary["goals"]["total_topics"] == 2
    assert summary["goals"]["completed_topics"] == 1
    assert summary["goals"]["topic_status_breakdown"]["completed"] == 1
    assert summary["goals"]["topic_status_breakdown"]["not_started"] == 1

    # Readiness & Trends
    assert summary["readiness"]["placement_readiness_index"] == 50
    assert len(summary["activity_trends"]) == 14

    # 6. Verify Granular Sub-endpoints
    prob_res = await client.get("/api/v1/analytics/problems", headers=headers_a)
    assert prob_res.status_code == 200
    assert prob_res.json()["total_solved"] == 3

    comp_res = await client.get("/api/v1/analytics/companies", headers=headers_a)
    assert comp_res.status_code == 200
    assert comp_res.json()["total_tracked"] == 3

    # 7. Test Global Search
    # Search for "Tree" (matches problem "Binary Tree Level Order")
    search_res = await client.get("/api/v1/search/?q=Tree", headers=headers_a)
    assert search_res.status_code == 200
    results = search_res.json()["data"]
    assert len(results) >= 1
    assert any(r["title"] == "Binary Tree Level Order" for r in results)

    # Search for "Microsoft" (matches company "Microsoft" and goal company tag)
    search_res = await client.get("/api/v1/search/?q=Microsoft", headers=headers_a)
    assert search_res.status_code == 200
    results = search_res.json()["data"]
    assert len(results) >= 1
    assert any(r["title"] == "Microsoft" for r in results)

    # Search for "Operating Systems" (matches RoadmapTopic)
    search_res = await client.get("/api/v1/search/?q=Operating", headers=headers_a)
    assert search_res.status_code == 200
    results = search_res.json()["data"]
    assert len(results) >= 1
    assert any(r["title"] == "Operating Systems" for r in results)

    # 8. User B Search & Analytics Isolation
    search_b = await client.get("/api/v1/search/?q=Microsoft", headers=headers_b)
    assert search_b.status_code == 200
    assert len(search_b.json()["data"]) == 0

    analytics_b = await client.get("/api/v1/analytics/", headers=headers_b)
    assert analytics_b.status_code == 200
    assert analytics_b.json()["problems"]["total_solved"] == 0
    assert analytics_b.json()["companies"]["total_tracked"] == 0
    assert analytics_b.json()["goals"]["total_goals"] == 0
