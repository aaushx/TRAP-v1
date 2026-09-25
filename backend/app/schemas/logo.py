"""TRAP — Logo.dev Enrichment Schemas

Pydantic schemas for Logo.dev Search and Brand enrichment API responses.
Ensures strict output contracts with ZERO exposure of server-side secret keys.
"""
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class LogoSearchCandidate(BaseModel):
    """Candidate company match returned from Logo.dev Search API for enrichment."""
    name: str
    domain: str
    logo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class LogoSearchResponse(BaseModel):
    """Enriched candidate list for administrative domain verification."""
    query: str
    count: int
    candidates: List[LogoSearchCandidate]


class LogoBrandProfile(BaseModel):
    """Structured brand intelligence returned from Logo.dev Brand API."""
    domain: str
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    colors: Optional[List[str]] = None
    verified: bool = False

    model_config = ConfigDict(from_attributes=True)
