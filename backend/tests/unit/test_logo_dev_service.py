"""TRAP — Unit Tests for LogoDevService

Tests authenticated communication with Logo.dev REST API endpoints,
header construction, candidate parsing, and security (zero secret leaks).
"""
import pytest
from unittest.mock import AsyncMock, patch
import httpx

from app.services.logo_dev import LogoDevService
from app.schemas.logo import LogoSearchCandidate, LogoBrandProfile


@pytest.mark.asyncio
async def test_logo_dev_service_headers_and_config():
    """Verify that LogoDevService configures Bearer authentication correctly."""
    service = LogoDevService(secret_key="sk_test_mock_key_12345")
    assert service.is_configured is True
    headers = service._get_headers()
    assert headers["Authorization"] == "Bearer sk_test_mock_key_12345"
    assert headers["Accept"] == "application/json"

    unconfigured = LogoDevService(secret_key="")
    assert unconfigured.is_configured is False
    assert unconfigured._get_headers() == {}


@pytest.mark.asyncio
async def test_search_candidates_mocked_success():
    """Verify that search candidates are parsed accurately without leaking credentials."""
    service = LogoDevService(secret_key="sk_test_mock_key_12345")
    mock_response = httpx.Response(
        status_code=200,
        json=[
            {"name": "Capgemini", "domain": "capgemini.com", "logo_url": "https://img.logo.dev/capgemini.com"},
            {"name": "Capgemini Invent", "domain": "capgemini.com/invent", "logo_url": None}
        ],
        request=httpx.Request("GET", "https://api.logo.dev/search?q=capgemini")
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        results = await service.search_candidates("Capgemini")

        assert len(results) == 2
        assert isinstance(results[0], LogoSearchCandidate)
        assert results[0].name == "Capgemini"
        assert results[0].domain == "capgemini.com"
        assert "sk_test" not in str(results[0])


@pytest.mark.asyncio
async def test_search_candidates_empty_or_error():
    """Verify graceful fallback to empty list when error occurs or query is empty."""
    service = LogoDevService(secret_key="sk_test_mock_key_12345")
    assert await service.search_candidates("") == []
    assert await service.search_candidates("   ") == []

    mock_error_response = httpx.Response(
        status_code=500,
        request=httpx.Request("GET", "https://api.logo.dev/search?q=err")
    )
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_error_response
        results = await service.search_candidates("err")
        assert results == []


@pytest.mark.asyncio
async def test_get_brand_profile_mocked_success():
    """Verify that get_brand_profile returns structured brand intelligence."""
    service = LogoDevService(secret_key="sk_test_mock_key_12345")
    mock_response = httpx.Response(
        status_code=200,
        json={
            "name": "Capgemini",
            "domain": "capgemini.com",
            "description": "Global leader in consulting and technology services.",
            "logo": "https://img.logo.dev/capgemini.com",
            "colors": ["#0070ad", "#ffffff"],
            "verified": True
        },
        request=httpx.Request("GET", "https://api.logo.dev/brand/capgemini.com")
    )

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        profile = await service.get_brand_profile("capgemini.com")

        assert profile is not None
        assert isinstance(profile, LogoBrandProfile)
        assert profile.name == "Capgemini"
        assert profile.domain == "capgemini.com"
        assert profile.verified is True
        assert "#0070ad" in profile.colors
        assert "sk_test" not in str(profile)
