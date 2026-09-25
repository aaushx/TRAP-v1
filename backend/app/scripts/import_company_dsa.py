"""Deterministic, idempotent dataset importer for Company-Wise DSA Preparation System.
Reads both LeetCode dataset archives:
1. leetcode-company-wise-problems-main
2. leetcode-companywise-interview-questions-master

Normalizes company aliases, canonicalizes question slugs, removes duplicates, merges topics
and frequency data, populates dsa_companies, company_questions, and dsa_company_questions,
and prints a comprehensive import summary.
"""
import os
import sys
import csv
import json
import re
import asyncio
from collections import defaultdict
from typing import Dict, Set, List, Any, Tuple

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import select
from app.database.engine import async_session_maker
from app.models.company_dsa import DsaCompany, CompanyQuestion, DsaCompanyQuestion

# Common alias dictionary for company normalization
COMPANY_ALIASES: Dict[str, str] = {
    "amazon.com": "Amazon",
    "amazon": "Amazon",
    "google llc": "Google",
    "google": "Google",
    "microsoft corporation": "Microsoft",
    "microsoft": "Microsoft",
    "meta": "Meta",
    "facebook": "Meta",
    "apple inc": "Apple",
    "apple": "Apple",
    "de shaw": "D. E. Shaw",
    "d. e. shaw": "D. E. Shaw",
    "tcs": "TCS",
    "tata consultancy services": "TCS",
    "infosys": "Infosys",
    "salesforce": "Salesforce",
    "salesforce.com": "Salesforce",
    "ibm": "IBM",
    "linkedin": "LinkedIn",
    "uber": "Uber",
    "bloomberg": "Bloomberg",
    "tiktok": "TikTok",
    "bytedance": "TikTok",
    "oracle": "Oracle",
    "goldman sachs": "Goldman Sachs",
    "walmart labs": "Walmart Labs",
    "walmart": "Walmart Labs",
    "adobe": "Adobe",
    "visa": "Visa",
    "accenture": "Accenture",
    "nvidia": "Nvidia",
    "yandex": "Yandex",
    "flipkart": "Flipkart",
    "paypal": "PayPal",
    "snowflake": "Snowflake",
    "phonepe": "PhonePe",
    "citadel": "Citadel",
    "cisco": "Cisco",
    "cisco systems": "Cisco",
    "doordash": "DoorDash",
    "zoho": "Zoho",
    "netflix": "Netflix",
    "atlassian": "Atlassian",
    "jpmorgan": "JPMorgan",
    "jpmorgan chase": "JPMorgan",
    "morgan stanley": "Morgan Stanley",
    "qualcomm": "Qualcomm",
    "intel": "Intel",
    "servicenow": "ServiceNow",
    "wells fargo": "Wells Fargo",
    "samsung": "Samsung",
    "media.net": "Media.net",
    "medianet": "Media.net"
}

def normalize_company_name(raw_name: str) -> str:
    """Normalize raw directory name into canonical company name."""
    clean = raw_name.replace("-", " ").replace("_", " ").strip()
    key = clean.lower()
    if key in COMPANY_ALIASES:
        return COMPANY_ALIASES[key]
    words = clean.split()
    return " ".join(w.capitalize() for w in words)

def slugify(s: str) -> str:
    """Convert string to canonical URL slug."""
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s)
    return s.strip('-')

async def run_import():
    ds1_root = r"C:\Users\infaa\Downloads\leetcode-company-wise-problems-main\leetcode-company-wise-problems-main"
    ds2_root = r"C:\Users\infaa\Downloads\leetcode-companywise-interview-questions-master\leetcode-companywise-interview-questions-master"

    print("============================================================")
    print("TRAP DETERMINISTIC DATASET IMPORTER — SPRINT 9")
    print("============================================================")
    print(f"Reading Dataset 1: {ds1_root}")
    print(f"Reading Dataset 2: {ds2_root}")

    # Aggregated structures keyed by slug to guarantee uniqueness
    companies_data: Dict[str, Dict[str, Any]] = {} # comp_slug -> {name, slug, aliases: set(), questions: set(slugs)}
    questions_data: Dict[str, Dict[str, Any]] = {} # q_slug -> {title, slug, difficulty, platform_url, topics: set(), companies: set(), frequency: str, source_dataset: str}
    company_question_freq: Dict[Tuple[str, str], str] = {} # (comp_slug, q_slug) -> frequency

    total_records_processed = 0
    duplicates_removed_count = 0
    questions_without_company = 0
    questions_without_difficulty = 0

    # ── 1. Process Dataset 1 ──────────────────────────────────────────
    if os.path.exists(ds1_root):
        for entry in os.listdir(ds1_root):
            comp_path = os.path.join(ds1_root, entry)
            if not os.path.isdir(comp_path):
                continue
            
            comp_name = normalize_company_name(entry)
            comp_slug = slugify(comp_name)
            if not comp_name or not comp_slug:
                questions_without_company += 1
                continue

            if comp_slug not in companies_data:
                companies_data[comp_slug] = {
                    "name": comp_name,
                    "slug": comp_slug,
                    "aliases": {entry},
                    "questions": set()
                }
            else:
                companies_data[comp_slug]["aliases"].add(entry)

            # Look for 5. All.csv or first available csv
            csv_file = os.path.join(comp_path, "5. All.csv")
            if not os.path.exists(csv_file):
                csvs = [f for f in os.listdir(comp_path) if f.endswith(".csv")]
                if csvs:
                    csv_file = os.path.join(comp_path, csvs[0])
                else:
                    continue

            with open(csv_file, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    total_records_processed += 1
                    title = (row.get("Title") or "").strip()
                    if not title:
                        continue
                    
                    q_slug = slugify(title)
                    if not q_slug:
                        continue

                    diff = (row.get("Difficulty") or "").strip().capitalize()
                    if not diff or diff not in ["Easy", "Medium", "Hard"]:
                        questions_without_difficulty += 1
                        diff = "Medium"

                    link = (row.get("Link") or "").strip()
                    topics_str = row.get("Topics") or ""
                    topics = [t.strip() for t in topics_str.split(",") if t.strip()]
                    freq = (row.get("Frequency") or "").strip()

                    companies_data[comp_slug]["questions"].add(q_slug)
                    company_question_freq[(comp_slug, q_slug)] = freq

                    if q_slug in questions_data:
                        duplicates_removed_count += 1
                        q = questions_data[q_slug]
                        for t in topics:
                            q["topics"].add(t)
                        q["companies"].add(comp_name)
                        if not q["platform_url"] and link:
                            q["platform_url"] = link
                    else:
                        questions_data[q_slug] = {
                            "title": title,
                            "slug": q_slug,
                            "difficulty": diff,
                            "platform_url": link,
                            "topics": set(topics),
                            "companies": {comp_name},
                            "frequency": freq,
                            "source_dataset": "DS1"
                        }

    # ── 2. Process Dataset 2 ──────────────────────────────────────────
    if os.path.exists(ds2_root):
        for entry in os.listdir(ds2_root):
            comp_path = os.path.join(ds2_root, entry)
            if not os.path.isdir(comp_path):
                continue

            comp_name = normalize_company_name(entry)
            comp_slug = slugify(comp_name)
            if not comp_name or not comp_slug:
                questions_without_company += 1
                continue

            if comp_slug not in companies_data:
                companies_data[comp_slug] = {
                    "name": comp_name,
                    "slug": comp_slug,
                    "aliases": {entry},
                    "questions": set()
                }
            else:
                companies_data[comp_slug]["aliases"].add(entry)

            csv_file = os.path.join(comp_path, "all.csv")
            if not os.path.exists(csv_file):
                csvs = [f for f in os.listdir(comp_path) if f.endswith(".csv")]
                if csvs:
                    csv_file = os.path.join(comp_path, csvs[0])
                else:
                    continue

            with open(csv_file, "r", encoding="utf-8", errors="ignore") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    total_records_processed += 1
                    title = (row.get("Title") or "").strip()
                    if not title:
                        continue

                    q_slug = slugify(title)
                    if not q_slug:
                        continue

                    diff = (row.get("Difficulty") or "").strip().capitalize()
                    if not diff or diff not in ["Easy", "Medium", "Hard"]:
                        questions_without_difficulty += 1
                        diff = "Medium"

                    url = (row.get("URL") or "").strip()
                    freq = (row.get("Frequency %") or "").strip()

                    companies_data[comp_slug]["questions"].add(q_slug)
                    if (comp_slug, q_slug) not in company_question_freq or not company_question_freq[(comp_slug, q_slug)]:
                        company_question_freq[(comp_slug, q_slug)] = freq

                    if q_slug in questions_data:
                        duplicates_removed_count += 1
                        q = questions_data[q_slug]
                        q["companies"].add(comp_name)
                        if not q["platform_url"] and url:
                            q["platform_url"] = url
                        q["source_dataset"] = "MERGED"
                    else:
                        questions_data[q_slug] = {
                            "title": title,
                            "slug": q_slug,
                            "difficulty": diff,
                            "platform_url": url,
                            "topics": set(),
                            "companies": {comp_name},
                            "frequency": freq,
                            "source_dataset": "DS2"
                        }

    # ── 3. Determine Ranking & Top 30 ─────────────────────────────────
    sorted_companies = sorted(
        companies_data.values(),
        key=lambda c: len(c["questions"]),
        reverse=True
    )
    top_30_slugs = {c["slug"] for c in sorted_companies[:30]}

    print(f"Total raw records parsed across both archives: {total_records_processed}")
    print(f"Unique companies detected: {len(companies_data)}")
    print(f"Unique questions normalized: {len(questions_data)}")
    print(f"Cross-dataset duplicate question instances merged: {duplicates_removed_count}")

    # ── 4. Persist Idempotently to PostgreSQL ─────────────────────────
    print("\nPersisting records to PostgreSQL database...")
    async with async_session_maker() as session:
        # A. Upsert Companies
        existing_comp_stmt = select(DsaCompany.slug, DsaCompany.id)
        res = await session.execute(existing_comp_stmt)
        existing_comp_map = {row[0]: row[1] for row in res.all()}

        comp_slug_to_id = {}
        for rank_idx, c in enumerate(sorted_companies, start=1):
            slug = c["slug"]
            is_top = slug in top_30_slugs
            q_count = len(c["questions"])
            aliases_list = sorted(list(c["aliases"]))

            if slug in existing_comp_map:
                c_id = existing_comp_map[slug]
                company = await session.get(DsaCompany, c_id)
                if company:
                    company.name = c["name"]
                    company.aliases = aliases_list
                    company.question_count = q_count
                    company.is_top_30 = is_top
                    company.rank = rank_idx if is_top else None
                    comp_slug_to_id[slug] = c_id
            else:
                new_c = DsaCompany(
                    name=c["name"],
                    slug=slug,
                    aliases=aliases_list,
                    question_count=q_count,
                    is_top_30=is_top,
                    rank=rank_idx if is_top else None
                )
                session.add(new_c)
                await session.flush()
                comp_slug_to_id[slug] = new_c.id

        # B. Upsert Questions
        existing_q_stmt = select(CompanyQuestion.slug, CompanyQuestion.id)
        res_q = await session.execute(existing_q_stmt)
        existing_q_map = {row[0]: row[1] for row in res_q.all()}

        q_slug_to_id = {}
        for q in questions_data.values():
            slug = q["slug"]
            topics_list = sorted(list(q["topics"]))
            companies_list = sorted(list(q["companies"]))
            c_count = len(companies_list)

            if slug in existing_q_map:
                q_id = existing_q_map[slug]
                question = await session.get(CompanyQuestion, q_id)
                if question:
                    question.title = q["title"]
                    question.difficulty = q["difficulty"]
                    if q["platform_url"]:
                        question.platform_url = q["platform_url"]
                    question.topics = topics_list
                    question.companies = companies_list
                    question.company_count = c_count
                    question.source_dataset = q["source_dataset"]
                    q_slug_to_id[slug] = q_id
            else:
                new_q = CompanyQuestion(
                    title=q["title"],
                    slug=slug,
                    difficulty=q["difficulty"],
                    platform_url=q["platform_url"],
                    topics=topics_list,
                    companies=companies_list,
                    company_count=c_count,
                    source_dataset=q["source_dataset"],
                    frequency=q.get("frequency")
                )
                session.add(new_q)
                await session.flush()
                q_slug_to_id[slug] = new_q.id

        # C. Upsert DsaCompanyQuestion junction records
        existing_links_stmt = select(DsaCompanyQuestion.company_id, DsaCompanyQuestion.question_id)
        res_links = await session.execute(existing_links_stmt)
        existing_links_set = set(res_links.all())

        new_links_count = 0
        for (comp_slug, q_slug), freq in company_question_freq.items():
            if comp_slug in comp_slug_to_id and q_slug in q_slug_to_id:
                c_id = comp_slug_to_id[comp_slug]
                q_id = q_slug_to_id[q_slug]
                if (c_id, q_id) not in existing_links_set:
                    link = DsaCompanyQuestion(
                        company_id=c_id,
                        question_id=q_id,
                        frequency=freq
                    )
                    session.add(link)
                    existing_links_set.add((c_id, q_id))
                    new_links_count += 1

        await session.commit()

    # ── 5. Print Required Summary ─────────────────────────────────────
    print("\n============================================================")
    print("IMPORT AUDIT SUMMARY")
    print("============================================================")
    print(f"Total companies: {len(companies_data)}")
    print(f"Total questions: {len(questions_data)}")
    print(f"Duplicate questions removed: {duplicates_removed_count}")
    print(f"Questions without company: {questions_without_company}")
    print(f"Questions without difficulty: {questions_without_difficulty}")
    print(f"Junction associations: {len(existing_links_set)}")

    print("\nTop 30 companies by question volume:")
    for rank_idx, c in enumerate(sorted_companies[:30], start=1):
        print(f"  {rank_idx:2d}. {c['name']:<20} — {len(c['questions']):>4} questions")
    print("============================================================\n")

if __name__ == "__main__":
    asyncio.run(run_import())
