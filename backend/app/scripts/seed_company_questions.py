"""Idempotent seed script for loading company questions into company_questions table.
Reads backend/app/core/library/company_questions_seed.json and upserts records based on unique slug.
Safe to run multiple times without duplicating data.
"""
import asyncio
import json
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import select
from app.database.engine import async_session_maker
from app.models.company_question import CompanyQuestion

async def seed_company_questions():
    seed_file = os.path.join(
        os.path.dirname(__file__), "..", "core", "library", "company_questions_seed.json"
    )
    if not os.path.exists(seed_file):
        print(f"Seed file not found at {seed_file}")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Loaded {len(records)} questions from seed file. Connecting to database...")

    async with async_session_maker() as session:
        # Fetch existing slugs
        stmt = select(CompanyQuestion.slug, CompanyQuestion.id)
        result = await session.execute(stmt)
        existing_slug_map = {row[0]: row[1] for row in result.all()}

        inserted_count = 0
        updated_count = 0

        for r in records:
            slug = r["slug"]
            if slug in existing_slug_map:
                # Update existing record
                q_id = existing_slug_map[slug]
                q = await session.get(CompanyQuestion, q_id)
                if q:
                    q.title = r["title"]
                    q.difficulty = r["difficulty"]
                    q.platform_url = r.get("platform_url")
                    q.topics = r.get("topics", [])
                    q.companies = r.get("companies", [])
                    q.company_count = r.get("company_count", len(q.companies))
                    q.acceptance_rate = r.get("acceptance_rate")
                    q.frequency = r.get("frequency")
                    updated_count += 1
            else:
                # Insert new record
                new_q = CompanyQuestion(
                    title=r["title"],
                    slug=slug,
                    difficulty=r["difficulty"],
                    platform_url=r.get("platform_url"),
                    topics=r.get("topics", []),
                    companies=r.get("companies", []),
                    company_count=r.get("company_count", len(r.get("companies", []))),
                    acceptance_rate=r.get("acceptance_rate"),
                    frequency=r.get("frequency")
                )
                session.add(new_q)
                inserted_count += 1

        await session.commit()
        print(f"Seeding completed successfully: {inserted_count} inserted, {updated_count} updated. Total in DB: {len(existing_slug_map) + inserted_count}.")

if __name__ == "__main__":
    asyncio.run(seed_company_questions())
