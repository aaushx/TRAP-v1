"""TRAP — Server-Side Logo.dev Integration Service

This service interacts exclusively with Logo.dev REST APIs (Search & Brand profiles)
from the secure FastAPI backend using the server-side Secret Key (Bearer authentication).

SECURITY & USAGE RULES:
1. The Secret Key (LOGO_DEV_SECRET_KEY) is strictly kept in backend memory and environment.
2. It is NEVER included in HTTP responses, logs, or error payloads.
3. This service is intended for DATA ENRICHMENT and administrative verification only.
   Normal application page rendering does NOT call these endpoints; it resolves
   pre-verified official domains stored in PostgreSQL and renders directly via the
   Logo.dev Image API with the Publishable Key.
"""
import logging
from typing import List, Optional, Dict, Any
import httpx

from app.core.config import settings
from app.schemas.logo import LogoSearchCandidate, LogoBrandProfile

logger = logging.getLogger(__name__)

# Base endpoint for Logo.dev server-side REST API
LOGO_DEV_API_BASE = "https://api.logo.dev"


class LogoDevService:
    """Service encapsulating authenticated REST calls to Logo.dev API."""

    def __init__(self, secret_key: Optional[str] = None):
        """Initialize service with server-side Secret Key.
        
        Why: We fall back to settings.LOGO_DEV_SECRET_KEY if secret_key is None,
        allowing callers to explicitly pass an empty string to simulate an unconfigured state.
        """
        self._secret_key = settings.LOGO_DEV_SECRET_KEY if secret_key is None else secret_key

    @property
    def is_configured(self) -> bool:
        """Check if Logo.dev Secret Key is configured."""
        return bool(self._secret_key and self._secret_key.strip())

    def _get_headers(self) -> Dict[str, str]:
        """Construct secure authorization headers for REST requests.
        
        Why: Logo.dev REST API endpoints require Bearer authentication with the Secret Key.
        """
        if not self.is_configured:
            return {}
        return {
            "Authorization": f"Bearer {self._secret_key.strip()}",
            "Accept": "application/json",
        }

    async def search_candidates(self, query: str) -> List[LogoSearchCandidate]:
        """Search company candidates via Logo.dev Search API for domain verification.
        
        IMPORTANT: Search results are CANDIDATES, not pre-verified truths.
        They must be reviewed before persisting as official_domain in PostgreSQL.
        
        Args:
            query: Company name or search term.
            
        Returns:
            List of LogoSearchCandidate objects.
        """
        if not query or not query.strip():
            return []

        if not self.is_configured:
            logger.warning("[LogoDevService] Search requested but LOGO_DEV_SECRET_KEY is not configured.")
            return []

        url = f"{LOGO_DEV_API_BASE}/search"
        params = {"q": query.strip()}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url, params=params, headers=self._get_headers())
                
                if response.status_code == 429:
                    logger.warning("[LogoDevService] Rate limit reached on Logo.dev Search API.")
                    return []
                
                if response.status_code != 200:
                    logger.warning(
                        "[LogoDevService] Search failed for query '%s' with HTTP %d",
                        query,
                        response.status_code
                    )
                    return []

                raw_data = response.json()
                # Parse returned items into candidate models
                candidates: List[LogoSearchCandidate] = []
                if isinstance(raw_data, list):
                    for item in raw_data:
                        if isinstance(item, dict) and item.get("domain"):
                            candidates.append(LogoSearchCandidate(
                                name=item.get("name") or query,
                                domain=item.get("domain", "").lower().strip(),
                                logo_url=item.get("logo_url")
                            ))
                return candidates

        except httpx.RequestError as exc:
            # Mask all network exceptions to prevent any potential header or credential leakage
            logger.error("[LogoDevService] Network error during Search API request: %s", type(exc).__name__)
            return []
        except Exception as exc:
            logger.error("[LogoDevService] Unexpected error during Search API processing: %s", type(exc).__name__)
            return []

    async def get_brand_profile(self, domain: str) -> Optional[LogoBrandProfile]:
        """Retrieve full brand metadata for a company domain via Logo.dev Brand API.
        
        Used for data enrichment, company metadata validation, and domain verification.
        
        Args:
            domain: The official web domain (e.g. 'capgemini.com').
            
        Returns:
            LogoBrandProfile if found, or None.
        """
        if not domain or not domain.strip():
            return None

        if not self.is_configured:
            logger.warning("[LogoDevService] Brand profile requested but LOGO_DEV_SECRET_KEY is not configured.")
            return None

        clean_domain = domain.strip().lower()
        url = f"{LOGO_DEV_API_BASE}/brand/{clean_domain}"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url, headers=self._get_headers())
                
                if response.status_code == 404:
                    return None
                
                if response.status_code == 429:
                    logger.warning("[LogoDevService] Rate limit reached on Logo.dev Brand API.")
                    return None

                if response.status_code != 200:
                    logger.warning(
                        "[LogoDevService] Brand lookup failed for domain '%s' with HTTP %d",
                        clean_domain,
                        response.status_code
                    )
                    return None

                data = response.json()
                if not isinstance(data, dict):
                    return None

                # Extract brand attributes safely without exposing tokens
                return LogoBrandProfile(
                    domain=clean_domain,
                    name=data.get("name"),
                    description=data.get("description"),
                    logo_url=data.get("logo_url") or data.get("logo"),
                    colors=data.get("colors", []),
                    verified=bool(data.get("verified", False))
                )

        except httpx.RequestError as exc:
            logger.error("[LogoDevService] Network error during Brand API request: %s", type(exc).__name__)
            return None
        except Exception as exc:
            logger.error("[LogoDevService] Unexpected error during Brand API request: %s", type(exc).__name__)
            return None
