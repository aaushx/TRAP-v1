import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.models.user import User

pytestmark = pytest.mark.anyio

async def test_auth_and_user_flows(client: AsyncClient, db_session):
    # 1. Register a user
    register_payload = {
        "email": "testuser@example.com",
        "password": "securepassword123",
        "full_name": "Test User"
    }
    
    response = await client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 200
    res_json = response.json()
    assert "data" in res_json
    reg_data = res_json["data"]["user"]
    assert reg_data["email"] == "testuser@example.com"
    assert "id" in reg_data
    
    # 2. Registration Conflict for duplicate emails
    response = await client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 409
    assert response.json()["error_code"] == "CONFLICT"
    
    # 3. Validation failure check
    response = await client.post("/api/v1/auth/register", json={"email": "invalid-email", "password": "123"})
    assert response.status_code == 422
    assert response.json()["error_code"] == "VALIDATION_ERROR"
    
    # 4. Login user
    login_payload = {
        "email": "testuser@example.com",
        "password": "securepassword123"
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    res_json = response.json()
    token_data = res_json["data"]["tokens"]
    assert "access_token" in token_data
    assert "refresh_token" in token_data
    access_token = token_data["access_token"]
    
    # Authenticated headers
    auth_headers = {"Authorization": f"Bearer {access_token}"}
    
    # 5. Fetch profile `/me`
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    me_data = response.json()["data"]
    assert me_data["email"] == "testuser@example.com"
    
    # 6. Patch settings/preferences
    patch_payload = {
        "college": "Stanford University",
        "branch": "Computer Science",
        "preferred_language": "Python",
        "preferences": {
            "daily_reminders": True,
            "theme": "dark"
        }
    }
    response = await client.patch("/api/v1/users/me", json=patch_payload, headers=auth_headers)
    assert response.status_code == 200
    updated_data = response.json()["data"]
    assert updated_data["college"] == "Stanford University"
    assert updated_data["branch"] == "Computer Science"
    assert updated_data["preferences"]["daily_reminders"] is True
    
    # 7. Change password successfully
    chg_password_payload = {
        "current_password": "securepassword123",
        "new_password": "newsecurepassword123"
    }
    response = await client.post("/api/v1/users/me/change-password", json=chg_password_payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"
    
    # Login again with new password
    login_payload["password"] = "newsecurepassword123"
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200
    
    # 8. Export user data
    response = await client.get("/api/v1/users/me/export", headers=auth_headers)
    assert response.status_code == 200
    export_data = response.json()["data"]
    assert "profile" in export_data
    assert export_data["profile"]["email"] == "testuser@example.com"
    
    # 9. Delete account (cascade-delete verified)
    response = await client.delete("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["message"] == "Account deleted successfully"
    
    # Verify user is removed from database
    stmt = select(User).where(User.email == "testuser@example.com")
    result = await db_session.execute(stmt)
    user_in_db = result.scalar_one_or_none()
    assert user_in_db is None
