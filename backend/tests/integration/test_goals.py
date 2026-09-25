import pytest
from httpx import AsyncClient
from uuid import uuid4
from sqlalchemy import select
from app.models.roadmap import Roadmap, RoadmapCategory, RoadmapTopic

pytestmark = pytest.mark.anyio

async def test_goals_crud_and_ownership(client: AsyncClient, db_session):
    # 1. Register User A and User B
    user_a_payload = {"email": "usera_goal@example.com", "password": "password123", "full_name": "User A"}
    user_b_payload = {"email": "userb_goal@example.com", "password": "password123", "full_name": "User B"}
    
    await client.post("/api/v1/auth/register", json=user_a_payload)
    await client.post("/api/v1/auth/register", json=user_b_payload)
    
    # Login User A
    response = await client.post("/api/v1/auth/login", json=user_a_payload)
    token_a = response.json()["data"]["tokens"]["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    
    # Login User B
    response = await client.post("/api/v1/auth/login", json=user_b_payload)
    token_b = response.json()["data"]["tokens"]["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    
    # 2. Get master library templates
    response = await client.get("/api/v1/goals/library", headers=headers_a)
    assert response.status_code == 200
    
    # 3. Create goal roadmap as User A
    goal_payload = {
        "title": "Prepare for Google",
        "description": "Master DSA and System Design",
        "target_date": "2026-12-31T23:59:59",
        "target_role": "SWE II",
        "target_companies": ["Google", "Waymo"],
        "priority": "high",
        "categories": [
            {
                "name": "Data Structures",
                "sort_order": 1,
                "topics": [
                    {
                        "name": "Arrays",
                        "status": "not_started",
                        "difficulty": "easy",
                        "estimated_hours": 4,
                        "resource_links": [{"title": "Leetcode", "url": "https://leetcode.com"}],
                        "notes": "Must practice binary search.",
                        "sort_order": 1
                    }
                ]
            }
        ]
    }
    response = await client.post("/api/v1/goals/", json=goal_payload, headers=headers_a)
    assert response.status_code == 201
    goal_a = response.json()
    assert goal_a["title"] == "Prepare for Google"
    goal_a_id = goal_a["id"]
    
    # 4. List goals as User A (must show 1 goal)
    response = await client.get("/api/v1/goals/", headers=headers_a)
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 5. List goals as User B (must show 0 goals)
    response = await client.get("/api/v1/goals/", headers=headers_b)
    assert response.status_code == 200
    assert len(response.json()) == 0
    
    # 6. User B tries to retrieve User A's goal details (must return 403 Forbidden as per endpoint definition)
    response = await client.get(f"/api/v1/goals/{goal_a_id}", headers=headers_b)
    assert response.status_code == 403
    assert response.json()["error_code"] == "FORBIDDEN"
    
    # 7. User B tries to update User A's goal details (must return 403 Forbidden)
    response = await client.patch(f"/api/v1/goals/{goal_a_id}", json={"title": "Hacked Title"}, headers=headers_b)
    assert response.status_code == 403
    
    # 8. User A updates the goal
    response = await client.patch(f"/api/v1/goals/{goal_a_id}", json={"title": "Prepare for Alphabet", "priority": "medium"}, headers=headers_a)
    assert response.status_code == 200
    assert response.json()["title"] == "Prepare for Alphabet"
    assert response.json()["priority"] == "medium"
    
    # Fetch User A's updated topics to test status updates
    # Let's retrieve arrays topic_id directly from the database using SQLAlchemy
    stmt = select(RoadmapTopic).join(RoadmapCategory).where(RoadmapCategory.roadmap_id == goal_a_id)
    result = await db_session.execute(stmt)
    topic = result.scalars().first()
    assert topic is not None
    topic_id = str(topic.id)
    
    # 9. User B tries to update the status of User A's topic (must return 403 Forbidden)
    topic_patch_payload = {"status": "completed", "notes": "Hacked Notes"}
    response = await client.patch(f"/api/v1/goals/topics/{topic_id}/status", json=topic_patch_payload, headers=headers_b)
    assert response.status_code == 403

    # 10. User A attempts to send an invalid topic status (must return 422 Validation Error)
    response = await client.patch(f"/api/v1/goals/topics/{topic_id}/status", json={"status": "invalid_status"}, headers=headers_a)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    
    # 11. User A updates the status of the topic to 'completed' (must succeed)
    response = await client.patch(f"/api/v1/goals/topics/{topic_id}/status", json={"status": "completed", "notes": "Completed arrays topic"}, headers=headers_a)
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["notes"] == "Completed arrays topic"

    # 12. Verify Goal progress is now 100% and persisted
    response = await client.get(f"/api/v1/goals/{goal_a_id}", headers=headers_a)
    assert response.status_code == 200
    assert response.json()["progress"] == 100
    
    # 13. User B tries to delete User A's goal (must return 403)
    response = await client.delete(f"/api/v1/goals/{goal_a_id}", headers=headers_b)
    assert response.status_code == 403
    
    # 14. User A deletes the goal (must succeed)
    response = await client.delete(f"/api/v1/goals/{goal_a_id}", headers=headers_a)
    assert response.status_code == 204
    
    # Verify deletion
    response = await client.get(f"/api/v1/goals/{goal_a_id}", headers=headers_a)
    assert response.status_code == 404
