import pytest
from httpx import AsyncClient
from uuid import uuid4

pytestmark = pytest.mark.anyio

async def test_problems_crud_and_ownership(client: AsyncClient):
    # 1. Register User A and User B
    user_a_payload = {"email": "usera@example.com", "password": "password123", "full_name": "User A"}
    user_b_payload = {"email": "userb@example.com", "password": "password123", "full_name": "User B"}
    
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
    
    # 2. Create problem as User A
    problem_payload = {
        "title": "Two Sum",
        "platform": "leetcode",
        "platform_url": "https://leetcode.com/problems/two-sum",
        "topic": "Arrays",
        "difficulty": "easy",
        "status": "solved",
        "is_bookmarked": True,
        "notes": "Use a hash map to search in O(n) time.",
        "time_complexity": "O(N)",
        "space_complexity": "O(N)"
    }
    response = await client.post("/api/v1/problems/", json=problem_payload, headers=headers_a)
    assert response.status_code == 201
    problem_a = response.json()
    assert problem_a["title"] == "Two Sum"
    problem_a_id = problem_a["id"]
    
    # 3. List problems as User A (must show 1 problem)
    response = await client.get("/api/v1/problems/", headers=headers_a)
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 4. List problems as User B (must show 0 problems - isolation)
    response = await client.get("/api/v1/problems/", headers=headers_b)
    assert response.status_code == 200
    assert len(response.json()) == 0
    
    # 5. User B attempts to access User A's problem (should return 404 Not Found for resource isolation)
    response = await client.get(f"/api/v1/problems/{problem_a_id}", headers=headers_b)
    assert response.status_code == 404
    assert response.json()["error_code"] == "NOT_FOUND"
    
    # 6. User B attempts to update User A's problem (should return 404 Not Found)
    response = await client.put(f"/api/v1/problems/{problem_a_id}", json={"title": "Hacked Title"}, headers=headers_b)
    assert response.status_code == 404
    
    # 7. User A updates the problem
    response = await client.put(f"/api/v1/problems/{problem_a_id}", json={"title": "Two Sum Optimised", "difficulty": "medium"}, headers=headers_a)
    assert response.status_code == 200
    assert response.json()["title"] == "Two Sum Optimised"
    
    # 8. User B attempts to bulk delete User A's problem
    response = await client.post("/api/v1/problems/bulk-delete", json=[problem_a_id], headers=headers_b)
    # Bulk delete reports success of the deleted count for own records, but does not delete another user's problem
    # Let's verify that problem A still exists for User A
    response = await client.get(f"/api/v1/problems/{problem_a_id}", headers=headers_a)
    assert response.status_code == 200
    
    # 9. User A deletes the problem
    response = await client.delete(f"/api/v1/problems/{problem_a_id}", headers=headers_a)
    assert response.status_code == 200
    
    # Verify it is deleted
    response = await client.get(f"/api/v1/problems/{problem_a_id}", headers=headers_a)
    assert response.status_code == 404
