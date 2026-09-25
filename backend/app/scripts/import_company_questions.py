"""Deterministic, idempotent dataset importer for Company-Wise DSA Preparation System.

Reads both LeetCode dataset archives:
1. C:\\Users\\infaa\\Downloads\\leetcode-company-wise-problems-main\\leetcode-company-wise-problems-main
2. C:\\Users\\infaa\\Downloads\\leetcode-companywise-interview-questions-master\\leetcode-companywise-interview-questions-master

Parses all time-period CSV files (30 days, 3 months, 6 months, > 6 months, all-time),
normalizes company entities, deduplicates questions by canonical LeetCode slug,
merges topic tags, acceptance rates, and frequency metrics, and populates
the PostgreSQL database.
"""

import os
import sys
import csv
import json
import re
import argparse
import asyncio
from collections import defaultdict
from typing import Dict, Set, List, Any, Tuple, Optional

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sqlalchemy import select, delete, func
from app.database.engine import async_session_maker
from app.models.company_dsa import DsaCompany, CompanyQuestion, DsaCompanyQuestion

# Canonical company aliases dictionary
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
    "d-e-shaw": "D. E. Shaw",
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
    "medianet": "Media.net",
    "spotify": "Spotify",
    "stripe": "Stripe",
    "palantir": "Palantir",
    "palantir technologies": "Palantir",
    "slack": "Slack",
    "dropbox": "Dropbox",
    "tesla": "Tesla",
    "reddit": "Reddit",
    "pinterest": "Pinterest",
    "twitch": "Twitch",
    "zoom": "Zoom",
    "shopify": "Shopify",
    "robinhood": "Robinhood",
    "canva": "Canva",
    "cloudflare": "Cloudflare",
    "datadog": "Datadog",
    "github": "GitHub",
    "gitlab": "GitLab",
    "mongodb": "MongoDB",
    "twilio": "Twilio",
    "swiggy": "Swiggy",
    "zomato": "Zomato",
    "razorpay": "Razorpay",
    "cred": "Cred",
    "paytm": "PayTM",
    "box": "Box",
    "booking.com": "Booking.com",
    "booking": "Booking.com",
    "deliveroo": "Deliveroo",
    "grab": "Grab",
    "gojek": "Gojek",
    "duolingo": "Duolingo",
    "affirm": "Affirm",
    "coinbase": "Coinbase",
    "amd": "AMD",
    "databricks": "Databricks",
    "unity": "Unity",
    "hashicorp": "HashiCorp",
    "elastic": "Elastic",
    "hubspot": "HubSpot",
    "okta": "Okta",
    "asana": "Asana",
    "figma": "Figma",
    "notion": "Notion",
    "discord": "Discord",
    "spacex": "SpaceX",
    "epic games": "Epic Games",
    "western digital": "Western Digital",
    "juniper networks": "Juniper Networks",
    "vmware": "VMware",
    "square": "Square",
    "block": "Square",
    "roblox": "Roblox",
    "splunk": "Splunk",
    "wayfair": "Wayfair",
    "yelp": "Yelp",
    "tripadvisor": "TripAdvisor",
    "quora": "Quora",
    "openai": "OpenAI",
    "anduril": "Anduril",
    "twitter": "Twitter",
    "cognizant": "Cognizant",
    "coupang": "Coupang",
    "palo alto networks": "Palo Alto Networks",
    "agoda": "Agoda",
    "meesho": "Meesho",
    "sprinklr": "Sprinklr",
    "deloitte": "Deloitte",
    "arista networks": "Arista Networks",
    "sap": "SAP",
    "rubrik": "Rubrik",
    "two sigma": "Two Sigma",
    "blackrock": "BlackRock",
    "barclays": "Barclays",
    "coursera": "Coursera",
    "instacart": "Instacart",
    "rivian": "Rivian",
    "american express": "American Express"
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

def extract_slug_from_url(url: str, fallback_title: str) -> str:
    """Extract canonical problem slug from LeetCode URL or fallback to title slug."""
    if url:
        match = re.search(r'/problems/([^/?#]+)', url)
        if match:
            return match.group(1).strip().lower()
    return slugify(fallback_title)

def map_time_period(filename: str) -> str:
    """Map CSV filename to standardized time-period identifier."""
    fn = filename.lower()
    if "thirty" in fn or "30" in fn:
        return "thirty_days"
    if "three" in fn or "3" in fn:
        return "three_months"
    if "six" in fn and "more" not in fn and ">" not in fn:
        return "six_months"
    if "more" in fn or "older" in fn or ">" in fn:
        return "more_than_six_months"
    return "all_time"

async def run_import(dry_run: bool = False, dataset_dir: Optional[str] = None):
    """Execute complete ingestion pipeline across LeetCode archives."""
    default_ds1 = r"C:\Users\infaa\Downloads\leetcode-company-wise-problems-main\leetcode-company-wise-problems-main"
    if not os.path.exists(default_ds1):
        default_ds1 = r"C:\Users\infaa\Downloads\leetcode-company-wise-problems-main"
        
    default_ds2 = r"C:\Users\infaa\Downloads\leetcode-companywise-interview-questions-master\leetcode-companywise-interview-questions-master"
    if not os.path.exists(default_ds2):
        default_ds2 = r"C:\Users\infaa\Downloads\leetcode-companywise-interview-questions-master"

    ds1_root = dataset_dir if dataset_dir else default_ds1
    ds2_root = default_ds2

    print("============================================================")
    print(f"TRAP COMPANY-WISE DSA DATASET IMPORTER {'(DRY RUN)' if dry_run else ''}")
    print("============================================================")
    print(f"Dataset 1: {ds1_root} (Exists: {os.path.exists(ds1_root)})")
    print(f"Dataset 2: {ds2_root} (Exists: {os.path.exists(ds2_root)})\n")

    # Data structures
    companies_data: Dict[str, Dict[str, Any]] = {} # comp_slug -> {name, slug, aliases: set(), question_slugs: set()}
    questions_data: Dict[str, Dict[str, Any]] = {} # q_slug -> {external_id, title, slug, difficulty, platform_url, topics: set(), companies: set(), acceptance_rate, frequency}
    company_question_links: Dict[Tuple[str, str], Dict[str, Any]] = {} # (comp_slug, q_slug) -> {frequency, time_periods: set(), source_file}

    total_files_parsed = 0
    total_raw_records = 0
    skipped_records = 0

    # 1. Process Dataset 1 (leetcode-company-wise-problems-main)
    if os.path.exists(ds1_root):
        print("Parsing Dataset 1 (Topics & Time-Period partitioned)...")
        for entry in os.listdir(ds1_root):
            comp_path = os.path.join(ds1_root, entry)
            if not os.path.isdir(comp_path) or entry.startswith('.'):
                continue

            comp_name = normalize_company_name(entry)
            comp_slug = slugify(comp_name)
            if not comp_name or not comp_slug:
                continue

            if comp_slug not in companies_data:
                companies_data[comp_slug] = {
                    "name": comp_name,
                    "slug": comp_slug,
                    "aliases": {entry},
                    "question_slugs": set()
                }
            else:
                companies_data[comp_slug]["aliases"].add(entry)

            csv_files = [f for f in os.listdir(comp_path) if f.endswith(".csv")]
            for csv_fn in csv_files:
                csv_fp = os.path.join(comp_path, csv_fn)
                time_period = map_time_period(csv_fn)
                total_files_parsed += 1

                try:
                    with open(csv_fp, "r", encoding="utf-8", errors="ignore") as fp:
                        reader = csv.DictReader(fp)
                        for row in reader:
                            total_raw_records += 1
                            title = (row.get("Title") or "").strip()
                            if not title:
                                skipped_records += 1
                                continue

                            link = (row.get("Link") or row.get("URL") or "").strip()
                            q_slug = extract_slug_from_url(link, title)
                            if not q_slug:
                                skipped_records += 1
                                continue

                            diff = (row.get("Difficulty") or "").strip().capitalize()
                            if diff not in ["Easy", "Medium", "Hard"]:
                                diff = "Medium"

                            topics_str = row.get("Topics") or ""
                            topics = [t.strip() for t in topics_str.split(",") if t.strip()]
                            freq = (row.get("Frequency") or "").strip()
                            accept_rate = (row.get("Acceptance Rate") or row.get("Acceptance %") or "").strip()

                            companies_data[comp_slug]["question_slugs"].add(q_slug)

                            # Link key
                            link_key = (comp_slug, q_slug)
                            if link_key not in company_question_links:
                                company_question_links[link_key] = {
                                    "frequency": freq,
                                    "time_periods": {time_period},
                                    "source_file": csv_fn
                                }
                            else:
                                company_question_links[link_key]["time_periods"].add(time_period)
                                if freq and not company_question_links[link_key]["frequency"]:
                                    company_question_links[link_key]["frequency"] = freq

                            # Question record
                            if q_slug in questions_data:
                                q = questions_data[q_slug]
                                for t in topics:
                                    q["topics"].add(t)
                                q["companies"].add(comp_name)
                                if not q["platform_url"] and link:
                                    q["platform_url"] = link
                                if not q["acceptance_rate"] and accept_rate:
                                    q["acceptance_rate"] = accept_rate
                            else:
                                questions_data[q_slug] = {
                                    "external_id": None,
                                    "title": title,
                                    "slug": q_slug,
                                    "difficulty": diff,
                                    "platform_url": link or f"https://leetcode.com/problems/{q_slug}",
                                    "topics": set(topics),
                                    "companies": {comp_name},
                                    "acceptance_rate": accept_rate,
                                    "frequency": freq,
                                    "source_dataset": "DS1"
                                }
                except Exception as e:
                    print(f"  [Warning] Error parsing {csv_fp}: {e}")

    # 2. Process Dataset 2 (leetcode-companywise-interview-questions-master)
    if os.path.exists(ds2_root):
        print("Parsing Dataset 2 (ID & Frequency % partitioned)...")
        for entry in os.listdir(ds2_root):
            comp_path = os.path.join(ds2_root, entry)
            if not os.path.isdir(comp_path) or entry.startswith('.'):
                continue

            comp_name = normalize_company_name(entry)
            comp_slug = slugify(comp_name)
            if not comp_name or not comp_slug:
                continue

            if comp_slug not in companies_data:
                companies_data[comp_slug] = {
                    "name": comp_name,
                    "slug": comp_slug,
                    "aliases": {entry},
                    "question_slugs": set()
                }
            else:
                companies_data[comp_slug]["aliases"].add(entry)

            csv_files = [f for f in os.listdir(comp_path) if f.endswith(".csv")]
            for csv_fn in csv_files:
                csv_fp = os.path.join(comp_path, csv_fn)
                time_period = map_time_period(csv_fn)
                total_files_parsed += 1

                try:
                    with open(csv_fp, "r", encoding="utf-8", errors="ignore") as fp:
                        reader = csv.DictReader(fp)
                        for row in reader:
                            total_raw_records += 1
                            title = (row.get("Title") or "").strip()
                            if not title:
                                skipped_records += 1
                                continue

                            ext_id = (row.get("ID") or "").strip()
                            url = (row.get("URL") or "").strip()
                            q_slug = extract_slug_from_url(url, title)
                            if not q_slug:
                                skipped_records += 1
                                continue

                            diff = (row.get("Difficulty") or "").strip().capitalize()
                            if diff not in ["Easy", "Medium", "Hard"]:
                                diff = "Medium"

                            freq = (row.get("Frequency %") or row.get("Frequency") or "").strip()
                            accept_rate = (row.get("Acceptance %") or "").strip()

                            companies_data[comp_slug]["question_slugs"].add(q_slug)

                            link_key = (comp_slug, q_slug)
                            if link_key not in company_question_links:
                                company_question_links[link_key] = {
                                    "frequency": freq,
                                    "time_periods": {time_period},
                                    "source_file": csv_fn
                                }
                            else:
                                company_question_links[link_key]["time_periods"].add(time_period)
                                if freq and not company_question_links[link_key]["frequency"]:
                                    company_question_links[link_key]["frequency"] = freq

                            if q_slug in questions_data:
                                q = questions_data[q_slug]
                                if ext_id and not q["external_id"]:
                                    q["external_id"] = ext_id
                                if url and not q["platform_url"]:
                                    q["platform_url"] = url
                                if accept_rate and not q["acceptance_rate"]:
                                    q["acceptance_rate"] = accept_rate
                                q["companies"].add(comp_name)
                            else:
                                questions_data[q_slug] = {
                                    "external_id": ext_id or None,
                                    "title": title,
                                    "slug": q_slug,
                                    "difficulty": diff,
                                    "platform_url": url or f"https://leetcode.com/problems/{q_slug}",
                                    "topics": set(),
                                    "companies": {comp_name},
                                    "acceptance_rate": accept_rate,
                                    "frequency": freq,
                                    "source_dataset": "DS2"
                                }
                except Exception as e:
                    print(f"  [Warning] Error parsing {csv_fp}: {e}")

    # Top 30 calculation based on total unique questions
    sorted_companies = sorted(
        companies_data.values(),
        key=lambda c: len(c["question_slugs"]),
        reverse=True
    )
    for rank, comp in enumerate(sorted_companies, start=1):
        comp["rank"] = rank
        comp["is_top_30"] = rank <= 30
        comp["question_count"] = len(comp["question_slugs"])

    print("\n============================================================")
    print("INGESTION & NORMALIZATION SUMMARY")
    print("============================================================")
    print(f"Total CSV Files Processed:     {total_files_parsed}")
    print(f"Total Raw Question Records:    {total_raw_records}")
    print(f"Skipped Malformed Records:     {skipped_records}")
    print(f"Unique Canonical Companies:    {len(companies_data)}")
    print(f"Unique Canonical Questions:    {len(questions_data)}")
    print(f"Company-Question Link Pairs:   {len(company_question_links)}")
    print("============================================================\n")

    print("Top 10 Companies by Question Count:")
    for comp in sorted_companies[:10]:
        print(f"  #{comp['rank']} {comp['name']} ({comp['slug']}): {comp['question_count']} questions")

    if dry_run:
        print("\n[Dry Run Mode] No database changes applied.")
        return

    # 3. Database Persistence (Upsert & Synchronization)
    print("\nPersisting entities to PostgreSQL database...")
    async with async_session_maker() as session:
        async with session.begin():
            # A. Upsert Companies
            print("  1. Upserting DsaCompany records...")
            company_id_map: Dict[str, Any] = {} # comp_slug -> company_id

            # Fetch existing companies
            existing_comp_res = await session.execute(select(DsaCompany))
            existing_comp_map = {c.slug: c for c in existing_comp_res.scalars().all()}

            for comp in companies_data.values():
                slug = comp["slug"]
                aliases_list = sorted(list(comp["aliases"]))
                if slug in existing_comp_map:
                    db_comp = existing_comp_map[slug]
                    db_comp.name = comp["name"]
                    db_comp.aliases = aliases_list
                    db_comp.question_count = comp["question_count"]
                    db_comp.is_top_30 = comp["is_top_30"]
                    db_comp.rank = comp["rank"]
                    company_id_map[slug] = db_comp.id
                else:
                    new_comp = DsaCompany(
                        name=comp["name"],
                        slug=slug,
                        aliases=aliases_list,
                        question_count=comp["question_count"],
                        is_top_30=comp["is_top_30"],
                        rank=comp["rank"]
                    )
                    session.add(new_comp)
                    await session.flush()
                    company_id_map[slug] = new_comp.id

            # B. Upsert Questions
            print("  2. Upserting CompanyQuestion records...")
            question_id_map: Dict[str, Any] = {} # q_slug -> question_id

            existing_q_res = await session.execute(select(CompanyQuestion))
            existing_q_map = {q.slug: q for q in existing_q_res.scalars().all()}

            for q_data in questions_data.values():
                q_slug = q_data["slug"]
                topics_list = sorted(list(q_data["topics"]))
                companies_list = sorted(list(q_data["companies"]))

                if q_slug in existing_q_map:
                    db_q = existing_q_map[q_slug]
                    db_q.title = q_data["title"]
                    if q_data["external_id"] and not db_q.external_id:
                        db_q.external_id = q_data["external_id"]
                    db_q.difficulty = q_data["difficulty"]
                    if q_data["platform_url"]:
                        db_q.platform_url = q_data["platform_url"]
                    db_q.topics = topics_list
                    db_q.companies = companies_list
                    db_q.company_count = len(companies_list)
                    if q_data["acceptance_rate"]:
                        db_q.acceptance_rate = q_data["acceptance_rate"]
                    if q_data["frequency"]:
                        db_q.frequency = q_data["frequency"]
                    question_id_map[q_slug] = db_q.id
                else:
                    new_q = CompanyQuestion(
                        external_id=q_data["external_id"],
                        title=q_data["title"],
                        slug=q_slug,
                        difficulty=q_data["difficulty"],
                        platform_url=q_data["platform_url"],
                        topics=topics_list,
                        companies=companies_list,
                        company_count=len(companies_list),
                        acceptance_rate=q_data["acceptance_rate"],
                        frequency=q_data["frequency"],
                        source_dataset=q_data["source_dataset"]
                    )
                    session.add(new_q)
                    await session.flush()
                    question_id_map[q_slug] = new_q.id

            # C. Synchronize DsaCompanyQuestion Junction Records
            print("  3. Synchronizing DsaCompanyQuestion links...")
            # Remove existing links to refresh with updated time_periods & frequencies
            await session.execute(delete(DsaCompanyQuestion))

            # Batch insert all junction records
            junction_records = []
            for (comp_slug, q_slug), link_info in company_question_links.items():
                comp_id = company_id_map.get(comp_slug)
                q_id = question_id_map.get(q_slug)
                if comp_id and q_id:
                    junction_records.append({
                        "company_id": comp_id,
                        "question_id": q_id,
                        "frequency": link_info["frequency"] or None,
                        "time_periods": sorted(list(link_info["time_periods"])),
                        "source_file": link_info["source_file"]
                    })

            # Bulk insert using session.execute with insert statement for async compatibility
            batch_size = 2000
            for i in range(0, len(junction_records), batch_size):
                batch = junction_records[i:i + batch_size]
                await session.execute(
                    DsaCompanyQuestion.__table__.insert(),
                    batch
                )

        print("\n[SUCCESS] Database import committed successfully!")

def main():
    parser = argparse.ArgumentParser(description="Import LeetCode Company-Wise DSA questions into TRAP database.")
    parser.add_argument("--dry-run", action="store_true", help="Perform a dry run without modifying the database.")
    parser.add_argument("--dataset-dir", type=str, default=None, help="Custom path to dataset directory.")
    args = parser.parse_args()

    asyncio.run(run_import(dry_run=args.dry_run, dataset_dir=args.dataset_dir))

if __name__ == "__main__":
    main()
