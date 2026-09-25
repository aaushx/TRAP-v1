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
    
    # 2. User A attempts to create company with invalid status (must return 422)
    invalid_comp = {
        "name": "Invalid Corp",
        "role": "SWE",
        "status": "hired_fulltime_unknown"
    }
    response = await client.post("/api/v1/companies/", json=invalid_comp, headers=headers_a)
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"

    # User A creates valid company
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

    # 10. Test Top 30 Targeted Companies Directory
    dir_response = await client.get("/api/v1/companies/directory", headers=headers_a)
    assert dir_response.status_code == 200
    directory = dir_response.json()
    assert len(directory) == 30
    assert directory[0]["name"] == "Google"
    assert directory[0]["rank"] == 1
    assert "Array" in directory[0]["top_preparation_topics"]

    # Search directory for 'Amazon'
    search_dir = await client.get("/api/v1/companies/directory?search=Amazon", headers=headers_a)
    assert search_dir.status_code == 200
    assert any(c["name"] == "Amazon" for c in search_dir.json())

    # 11. User A tracks a Top 30 company with full intelligence metadata
    meta_comp_payload = {
        "name": "Amazon",
        "role": "Software Development Engineer",
        "status": "wishlist",
        "industry": "E-Commerce / Cloud Computing",
        "tier_category": "Tier-1 Big Tech (FAANG+)",
        "difficulty": "Medium",
        "preparation_topics": ["Array", "String", "Hash Table", "Math"]
    }
    c_res = await client.post("/api/v1/companies/", json=meta_comp_payload, headers=headers_a)
    assert c_res.status_code == 201
    created_c = c_res.json()
    assert created_c["name"] == "Amazon"
    assert created_c["tier_category"] == "Tier-1 Big Tech (FAANG+)"
    assert created_c["difficulty"] == "Medium"
    assert created_c["preparation_topics"] == ["Array", "String", "Hash Table", "Math"]

    # Multi-tenant check: User B cannot access User A's newly tracked company
    b_access = await client.get(f"/api/v1/companies/{created_c['id']}", headers=headers_b)
    assert b_access.status_code == 404
