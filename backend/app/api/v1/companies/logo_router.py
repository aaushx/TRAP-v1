"""TRAP — Company Logo & Brand Enrichment API Router

Endpoints for administrative domain verification and company data enrichment.
These endpoints interact with Logo.dev via the server-side Secret Key only.
Normal client-side company cards do NOT call these endpoints; they directly render
the Logo.dev Image API with the Publishable Key using PostgreSQL official_domain.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.logo import LogoSearchResponse, LogoBrandProfile
from app.services.logo_dev import LogoDevService

router = APIRouter(prefix="/logo", tags=["Company Logo Enrichment"])


def get_logo_dev_service() -> LogoDevService:
    """Dependency injector for LogoDevService."""
    return LogoDevService()


@router.get("/search", response_model=LogoSearchResponse)
async def search_company_domains(
    q: str = Query(..., min_length=1, max_length=100, description="Company name to search for domain candidates"),
    current_user: User = Depends(get_current_user),
    service: LogoDevService = Depends(get_logo_dev_service),
) -> LogoSearchResponse:
    """Search for company candidate domains via Logo.dev Search API.
    
    IMPORTANT: Candidate domains must be validated before being persisted as official_domain.
    This endpoint is used for administrative enrichment and setup, NOT runtime page views.
    """
    candidates = await service.search_candidates(query=q)
    return LogoSearchResponse(
        query=q,
        count=len(candidates),
        candidates=candidates
    )


@router.get("/brand/{domain}", response_model=LogoBrandProfile)
async def get_brand_profile(
    domain: str,
    current_user: User = Depends(get_current_user),
    service: LogoDevService = Depends(get_logo_dev_service),
) -> LogoBrandProfile:
    """Retrieve verified brand profile and colors for a company domain.
    
    Used to validate identity and enrich company intelligence metadata.
    """
    profile = await service.get_brand_profile(domain=domain)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Brand profile for domain '{domain}' not found."
        )
    return profile
