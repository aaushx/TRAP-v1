"""Integration tests for Company-Wise Placement Preparation Integration.
Verifies dataset presence, goal company-wise preparation endpoint, deduplication,
question filtering, status updates, Problem tracker sync, and multi-tenant isolation.
"""
import pytest
from httpx import AsyncClient
from uuid import uuid4
from app.models.company_question import CompanyQuestion

pytestmark = pytest.mark.anyio

async def test_company_preparation_flow_and_isolation(client: AsyncClient, db_session):
    # 0. Seed test company questions
    sample_questions = [
        CompanyQuestion(
            title="Two Sum",
            slug="two-sum",
            difficulty="Easy",
            platform_url="https://leetcode.com/problems/two-sum",
            topics=["Array", "Hash Table"],
            companies=["Google", "Amazon", "Microsoft"],
            company_count=3,
            acceptance_rate="0.50",
            frequency="95.0"
        ),
        CompanyQuestion(
            title="Number of Islands",
            slug="number-of-islands",
            difficulty="Medium",
            platform_url="https://leetcode.com/problems/number-of-islands",
            topics=["Array", "Breadth-First Search", "Depth-First Search", "Matrix"],
            companies=["Google", "Amazon", "Meta"],
            company_count=3,
            acceptance_rate="0.55",
            frequency="90.0"
        ),
        CompanyQuestion(
            title="LRU Cache",
            slug="lru-cache",
            difficulty="Medium",
            platform_url="https://leetcode.com/problems/lru-cache",
            topics=["Hash Table", "Linked List", "Design"],
            companies=["Google", "Amazon"],
            company_count=2,
            acceptance_rate="0.40",
            frequency="85.0"
        )
    ]
    for q in sample_questions:
        db_session.add(q)
    await db_session.commit()

    # 1. Register User A and User B
    email_a = f"prep_user_a_{uuid4().hex[:6]}@example.com"
    email_b = f"prep_user_b_{uuid4().hex[:6]}@example.com"
    
    await client.post("/api/v1/auth/register", json={"email": email_a, "password": "Password123!", "full_name": "User A"})
    await client.post("/api/v1/auth/register", json={"email": email_b, "password": "Password123!", "full_name": "User B"})

    # Login User A
    res_a = await client.post("/api/v1/auth/login", json={"email": email_a, "password": "Password123!"})
    token_a = res_a.json()["data"]["tokens"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Login User B
    res_b = await client.post("/api/v1/auth/login", json={"email": email_b, "password": "Password123!"})
    token_b = res_b.json()["data"]["tokens"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 2. User A creates a Goal targeting Google and Amazon
    goal_payload = {
        "title": "FAANG SWE Prep",
        "description": "Targeting Google and Amazon",
        "target_role": "Software Engineer",
        "target_companies": ["Google", "Amazon"],
        "priority": "High",
        "categories": [
            {
                "name": "Core Algorithms",
                "sort_order": 1,
                "topics": [
                    {
                        "name": "Two Pointers",
                        "status": "not_started",
                        "difficulty": "medium",
                        "estimated_hours": 3.0,
                        "sort_order": 1
                    }
                ]
            }
        ]
    }
    create_res = await client.post("/api/v1/goals/", json=goal_payload, headers=headers_a)
    assert create_res.status_code == 201
    goal_id = create_res.json()["id"]

    # 3. Fetch Company Preparation for this Goal
    prep_res = await client.get(f"/api/v1/goals/{goal_id}/company-preparation", headers=headers_a)
    assert prep_res.status_code == 200
    prep_data = prep_res.json()

    assert prep_data["goal_id"] == goal_id
    assert "Google" in prep_data["target_companies"]
    assert "Amazon" in prep_data["target_companies"]
    assert prep_data["total_unique_questions"] == 3
    assert len(prep_data["company_stats"]) == 2

    # Verify per-company stats structure
    comp_names = [cs["company_name"] for cs in prep_data["company_stats"]]
    assert "Google" in comp_names
    assert "Amazon" in comp_names

    # Check deduplication: universal question like "Number of Islands" appears once
    questions = prep_data["questions"]
    island_questions = [q for q in questions if "Number of Islands" in q["title"]]
    assert len(island_questions) == 1
    assert "Google" in island_questions[0]["companies"]
    assert "Amazon" in island_questions[0]["companies"]
    sample_q_id = island_questions[0]["id"]

    # 4. Test Filtering by difficulty
    diff_res = await client.get(
        f"/api/v1/goals/{goal_id}/company-preparation?difficulty=easy&limit=20",
        headers=headers_a
    )
    assert diff_res.status_code == 200
    for q in diff_res.json()["questions"]:
        assert q["difficulty"].lower() == "easy"

    # 5. Test Filtering by search
    search_res = await client.get(
        f"/api/v1/goals/{goal_id}/company-preparation?search=Two Sum",
        headers=headers_a
    )
    assert search_res.status_code == 200
    for q in search_res.json()["questions"]:
        assert "two sum" in q["title"].lower()

    # 6. User A updates status of "Number of Islands" to 'solved'
    update_res = await client.patch(
        f"/api/v1/goals/questions/{sample_q_id}/progress",
        json={"status": "solved", "notes": "Solved using BFS grid traversal"},
        headers=headers_a
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "solved"

    # Verify User A's updated preparation stats show solved_unique_questions >= 1
    prep_res_updated = await client.get(f"/api/v1/goals/{goal_id}/company-preparation", headers=headers_a)
    assert prep_res_updated.json()["solved_unique_questions"] == 1
    
    # Check that Number of Islands now has status 'solved' for User A
    updated_q = next(q for q in prep_res_updated.json()["questions"] if q["id"] == sample_q_id)
    assert updated_q["status"] == "solved"

    # Verify Problem tracker has synced this problem for User A
    probs_res = await client.get("/api/v1/problems/", headers=headers_a)
    assert probs_res.status_code == 200
    user_a_problems = probs_res.json()
    assert any("Number of Islands" in p["title"] and p["status"] == "solved" for p in user_a_problems)

    # 7. MULTI-TENANT ISOLATION TEST:
    # User B creates a goal with Google and Amazon
    create_b_res = await client.post("/api/v1/goals/", json=goal_payload, headers=headers_b)
    assert create_b_res.status_code == 201
    goal_b_id = create_b_res.json()["id"]

    prep_b_res = await client.get(f"/api/v1/goals/{goal_b_id}/company-preparation", headers=headers_b)
    assert prep_b_res.status_code == 200
    # For User B, Number of Islands MUST be 'not_started'
    q_b = next(q for q in prep_b_res.json()["questions"] if q["id"] == sample_q_id)
    assert q_b["status"] == "not_started"
    # User B's solved count must be 0
    assert prep_b_res.json()["solved_unique_questions"] == 0

    # Cross-tenant security: User B cannot access User A's goal preparation
    cross_res = await client.get(f"/api/v1/goals/{goal_id}/company-preparation", headers=headers_b)
    assert cross_res.status_code == 403
