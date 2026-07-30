import pytest
from httpx import AsyncClient
from uuid import uuid4

pytestmark = pytest.mark.anyio

async def test_companies_crud_and_ownership(client: AsyncClient):
    # 1. Register User A and User B
    user_a_payload = {"email": "usera_comp@example.com", "password": "password123", "full_name": "User A"}
    user_b_payload = {"email": "userb_comp@example.com", "password": "password123", "full_name": "User B"}
    
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
    
    # 2. Create company tracker log as User A
    company_payload = {
        "name": "Google",
        "role": "Software Engineer",
        "status": "applied",
        "applied_date": "2026-07-15T15:00:00",
        "job_url": "https://google.com/careers",
        "salary_range": "$150k - $200k",
        "notes": "Referral requested."
    }
    response = await client.post("/api/v1/companies/", json=company_payload, headers=headers_a)
    assert response.status_code == 201
    company_a = response.json()
    assert company_a["name"] == "Google"
    company_a_id = company_a["id"]
    
    # 3. List companies as User A (must show 1 company)
    response = await client.get("/api/v1/companies/", headers=headers_a)
    assert response.status_code == 200
    assert len(response.json()) == 1
    
    # 4. List companies as User B (must show 0 companies)
    response = await client.get("/api/v1/companies/", headers=headers_b)
    assert response.status_code == 200
    assert len(response.json()) == 0
    
    # 5. User B tries to retrieve User A's company details (must return 404)
    response = await client.get(f"/api/v1/companies/{company_a_id}", headers=headers_b)
    assert response.status_code == 404
    
    # 6. User B tries to update User A's company details (must return 404)
    response = await client.put(f"/api/v1/companies/{company_a_id}", json={"name": "Apple"}, headers=headers_b)
    assert response.status_code == 404
    
    # 7. User A updates the company
    response = await client.put(f"/api/v1/companies/{company_a_id}", json={"name": "Google Research", "status": "interviewing"}, headers=headers_a)
    assert response.status_code == 200
    assert response.json()["name"] == "Google Research"
    assert response.json()["status"] == "interviewing"
    
    # 8. User B tries to delete User A's company details (must return 404)
    response = await client.delete(f"/api/v1/companies/{company_a_id}", headers=headers_b)
    assert response.status_code == 404
    
    # 9. User A deletes the company
    response = await client.delete(f"/api/v1/companies/{company_a_id}", headers=headers_a)
    assert response.status_code == 200
    
    # Verify deletion
    response = await client.get(f"/api/v1/companies/{company_a_id}", headers=headers_a)
    assert response.status_code == 404
