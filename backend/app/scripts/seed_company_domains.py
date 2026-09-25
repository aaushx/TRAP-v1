"""TRAP — Database Company Official Domain Seeder

Populates and updates dsa_companies and companies tables with verified official_domain,
logo_provider ('logo.dev'), and logo_status ('VERIFIED').

This ensures PostgreSQL is the runtime source of truth for all company domains.
"""
import asyncio
import json
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import select, update
from app.database.engine import async_session_maker
from app.models.company_dsa import DsaCompany
from app.models.company import Company

# Explicitly verified canonical domains (critical priority list)
EXPLICIT_VERIFIED_DOMAINS = {
    "google": "google.com",
    "amazon": "amazon.com",
    "microsoft": "microsoft.com",
    "meta": "meta.com",
    "apple": "apple.com",
    "capgemini": "capgemini.com",
    "tcs": "tcs.com",
    "infosys": "infosys.com",
    "wipro": "wipro.com",
    "meesho": "meesho.com",
    "phonepe": "phonepe.com",
    "swiggy": "swiggy.com",
    "zomato": "zomato.com",
    "razorpay": "razorpay.com",
    "kpit": "kpit.com",
    "coforge": "coforge.com",
    "hashedin": "hashedin.com",
    "turing": "turing.com",
    "media.net": "media.net",
    "medianet": "media.net",
    "bloomberg": "bloomberg.com",
    "uber": "uber.com",
    "tiktok": "tiktok.com",
    "oracle": "oracle.com",
    "goldman sachs": "goldmansachs.com",
    "salesforce": "salesforce.com",
    "ibm": "ibm.com",
    "linkedin": "linkedin.com",
    "zoho": "zoho.com",
    "walmart labs": "walmart.com",
    "adobe": "adobe.com",
    "visa": "visa.com",
    "accenture": "accenture.com",
    "nvidia": "nvidia.com",
    "yandex": "yandex.com",
    "d. e. shaw": "deshaw.com",
    "flipkart": "flipkart.com",
    "paypal": "paypal.com",
    "snowflake": "snowflake.com",
    "citadel": "citadel.com",
    "cisco": "cisco.com",
    "doordash": "doordash.com",
}

async def seed_domains() -> None:
    """Read company manifest and explicit domains, updating PostgreSQL records."""
    manifest_path = os.path.join(os.path.dirname(__file__), "..", "..", "company-logo-manifest.json")
    manifest_entries = []
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_entries = json.load(f)

    manifest_map = {}
    for entry in manifest_entries:
        name_key = entry.get("companyName", "").strip().lower()
        slug_key = entry.get("logoFile", "").replace(".svg", "").replace(".png", "").strip().lower()
        domain = entry.get("officialDomain")
        if domain:
            manifest_map[name_key] = domain
            manifest_map[slug_key] = domain

    # Explicit verified overrides take highest precedence
    for k, v in EXPLICIT_VERIFIED_DOMAINS.items():
        manifest_map[k.lower()] = v

    async with async_session_maker() as session:
        # 1. Update dsa_companies
        stmt = select(DsaCompany)
        res = await session.execute(stmt)
        dsa_companies = res.scalars().all()

        updated_dsa = 0
        for comp in dsa_companies:
            matched_domain = None
            # Check explicit name match
            if comp.name.lower() in manifest_map:
                matched_domain = manifest_map[comp.name.lower()]
            elif comp.slug.lower() in manifest_map:
                matched_domain = manifest_map[comp.slug.lower()]
            else:
                for alias in (comp.aliases or []):
                    if alias.lower() in manifest_map:
                        matched_domain = manifest_map[alias.lower()]
                        break

            if matched_domain:
                comp.official_domain = matched_domain
                comp.logo_provider = "logo.dev"
                comp.logo_status = "VERIFIED"
                updated_dsa += 1
            else:
                comp.logo_provider = "logo.dev"
                comp.logo_status = "UNVERIFIED"

        # 2. Update user pipeline companies
        comp_stmt = select(Company)
        comp_res = await session.execute(comp_stmt)
        user_companies = comp_res.scalars().all()

        updated_user_comp = 0
        for comp in user_companies:
            matched_domain = None
            if comp.name.lower() in manifest_map:
                matched_domain = manifest_map[comp.name.lower()]

            if matched_domain:
                comp.official_domain = matched_domain
                comp.logo_provider = "logo.dev"
                comp.logo_status = "VERIFIED"
                updated_user_comp += 1
            else:
                comp.logo_provider = "logo.dev"
                comp.logo_status = "UNVERIFIED"

        await session.commit()
        print(f"[Seed] Successfully updated {updated_dsa}/{len(dsa_companies)} DSA companies with official domains.")
        print(f"[Seed] Successfully updated {updated_user_comp}/{len(user_companies)} user pipeline companies.")

if __name__ == "__main__":
    asyncio.run(seed_domains())
