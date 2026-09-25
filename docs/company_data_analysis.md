# TRAP — Company Data Integration Analysis Report
## Empirical Analysis of Placement Interview Datasets & Top 30 Most Targeted Companies

> **Analysis Date:** August 28, 2026  
> **Source Archives Audited:**
> 1. `C:\Users\infaa\Downloads\leetcode-company-wise-problems-main` (Dataset 1: Updated June 1, 2025)
> 2. `C:\Users\infaa\Downloads\leetcode-companywise-interview-questions-master` (Dataset 2: Updated July 12, 2026)  
> **Artifacts Produced:** `docs/company_data_analysis.md`, `docs/top_30_companies.json`

---

## 1. Dataset 1 Summary

* **Origin Repository:** `liquidslr/leetcode-company-wise-problems` (Snapshot: June 1, 2025).
* **Format:** File system organized by Company Name directory, containing up to 5 CSV files per company:
  - `1. Thirty Days.csv` (Recent questions from the past 30 days)
  - `2. Three Months.csv` (Recent questions from the past 90 days)
  - `3. Six Months.csv` (Questions from the past 180 days)
  - `4. More Than Six Months.csv` (Historical questions > 6 months)
  - `5. All.csv` (Complete historical problem set)
* **Schema Columns:** `Difficulty`, `Title`, `Frequency`, `Acceptance Rate`, `Link`, `Topics`.
* **Total Company Records / Folders:** **470 companies**.
* **Key Strength:** Contains detailed comma-separated technical `Topics` (e.g., Array, Dynamic Programming, Breadth-First Search, Graph Theory) per problem, providing rich curriculum intelligence.

---

## 2. Dataset 2 Summary

* **Origin Repository:** `snehasishroy/leetcode-companywise-interview-questions` (Snapshot: July 12, 2026).
* **Format:** File system organized by lowercase/normalized company directory, containing time-windowed CSV files:
  - `all.csv`
  - `six-months.csv`
  - `three-months.csv`
  - `more-than-six-months.csv`
* **Schema Columns:** `ID`, `URL`, `Title`, `Difficulty`, `Acceptance %`, `Frequency %`.
* **Total Company Records / Folders:** **660 companies**.
* **Key Strength:** More comprehensive directory of 660 companies with modern July 2026 interview question frequency percentages.

---

## 3. Combined Metrics & Cross-Dataset Overlap

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Total Company Folders in Dataset 1** | **470** | Title-cased directories with full topic metadata |
| **Total Company Folders in Dataset 2** | **660** | Comprehensive directory list with frequency percentages |
| **Combined Unique Normalized Entities** | **716** | Normalized across lowercase, punctuation, and legal suffixes |
| **Companies Present in BOTH Datasets** | **414** | High-confidence cross-verified placement targets |
| **Companies Present ONLY in Dataset 1** | **56** | E.g. specialized niche firms, academic labs, regional entities |
| **Companies Present ONLY in Dataset 2** | **246** | Additional newer startups, global boutique firms, international tech |

---

## 4. Duplicate & Alias Analysis

During recursive traversal and string normalization across both archives, the following spelling variants and alias patterns were discovered and mapped:

| Canonical Entity | Dataset 1 Folder | Dataset 2 Folder | Normalization Strategy |
| :--- | :--- | :--- | :--- |
| **TCS** | `tcs` | `tcs` | Capitalized to canonical corporate acronym `TCS` (Tata Consultancy Services). |
| **D. E. Shaw** | `DE Shaw` | `de-shaw` | Normalized hyphenated and spaced variants to canonical `D. E. Shaw`. |
| **Walmart Labs** | `Walmart Labs` | `walmart-labs` | Normalized hyphenation into canonical `Walmart Labs`. |
| **Goldman Sachs** | `Goldman Sachs` | `goldman-sachs` | Resolved hyphenated directory name in Dataset 2. |
| **PhonePe** | `PhonePe` | `phonepe` | Resolved camelCase to standard brand casing. |
| **DoorDash** | `DoorDash` | `doordash` | Standardized brand casing. |
| **IBM** | `IBM` | `ibm` | Upper-cased corporate acronym. |
| **LinkedIn** | `LinkedIn` | `linkedin` | Standardized CamelCase brand name. |
| **PayPal** | `PayPal` | `paypal` | Standardized CamelCase brand name. |
| **TikTok** | `TikTok` | `tiktok` | Standardized brand casing. |

---

## 5. Ranking Methodology

To determine the **Top 30 Most Targeted Companies** objectively and without personal bias, we engineered an evidence-based scoring formula directly tied to the underlying datasets:

$$\text{Score} = \max(Q_{\text{DS1}}, Q_{\text{DS2}}) + \text{Bonus}_{\text{CrossDataset}} (100) + \text{Bonus}_{\text{ActiveHiring}} (25)$$

Where:
1. **Total Problem References ($\max(Q_{\text{DS1}}, Q_{\text{DS2}})$):** The volume of unique interview coding questions logged for this company (ranging up to 2,344 questions).
2. **Cross-Dataset Recurrence Bonus ($+100$ pts):** Companies verified in **both** independent datasets receive priority over single-dataset mentions, proving consistent year-over-year placement relevance.
3. **Active Recent Hiring Bonus ($+25$ pts):** Companies with active problems recorded in the `30 Days` or `3 Months` recency windows receive an active hiring recency boost.
4. **Placement Breadth:** Evaluated across Big Tech (FAANG+), Global Enterprise & Cloud, Top FinTech & Quant Hedge Funds, Indian Product Unicorns, and Mass Campus Placement drivers.

---

## 6. Final Top 30 Most Targeted Companies Ranking

| Rank | Company | Tier / Category | Total Questions (DS1 / DS2) | Difficulty | Top Preparation Topics | Active Hiring Window | Score |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| **1** | **Google** | Tier-1 Big Tech (FAANG+) | 2,344 / 2,325 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **2,469** |
| **2** | **Amazon** | Tier-1 Big Tech (FAANG+) | 2,011 / 1,988 | **Medium** | Array, String, Hash Table, Math | 30d, 3m, 6m, All | **2,136** |
| **3** | **Meta** | Tier-1 Big Tech (FAANG+) | 1,399 / 1,381 | **Medium** | Array, String, Hash Table, Math | 30d, 3m, 6m, All | **1,524** |
| **4** | **Microsoft** | Tier-1 Big Tech (FAANG+) | 1,384 / 1,386 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **1,511** |
| **5** | **Bloomberg** | Global FinTech / High-Freq | 1,223 / 1,213 | **Medium** | Array, Hash Table, String, Math | 30d, 3m, 6m, All | **1,348** |
| **6** | **Uber** | Tier-1 Product Tech | 359 / 362 | **Hard** | Array, Hash Table, String, Breadth-First Search | 30d, 3m, 6m, All | **487** |
| **7** | **TikTok** | Tier-1 Product Tech | 348 / 349 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **474** |
| **8** | **Oracle** | Global Enterprise & Cloud | 299 / 313 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **438** |
| **9** | **Apple** | Tier-1 Big Tech (FAANG+) | 298 / 303 | **Medium** | Array, String, Hash Table, Breadth-First Search | 30d, 3m, 6m, All | **428** |
| **10** | **Goldman Sachs** | Investment Banking / FinTech | 264 / 261 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **389** |
| **11** | **TCS** | Major Mass Placement / IT | 253 / 240 | **Medium** | Array, Hash Table, String, Sorting | 30d, 3m, 6m, All | **378** |
| **12** | **Infosys** | Major Mass Placement / IT | 221 / 185 | **Medium** | Array, Dynamic Programming, String, Math | 30d, 3m, 6m, All | **346** |
| **13** | **Salesforce** | Global Enterprise & Cloud | 193 / 191 | **Hard** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **318** |
| **14** | **IBM** | Global Enterprise & Cloud | 173 / 178 | **Medium** | Array, String, Sorting, Hash Table | 30d, 3m, 6m, All | **303** |
| **15** | **LinkedIn** | Tier-1 Product Tech | 175 / 176 | **Medium** | Array, Hash Table, String, Depth-First Search | 30d, 3m, 6m, All | **301** |
| **16** | **Zoho** | Top SaaS / Product Unicorn | 155 / 169 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **294** |
| **17** | **Walmart Labs** | Top Product Engineering | 152 / 143 | **Medium** | Array, Hash Table, String, Dynamic Programming | 30d, 3m, 6m, All | **277** |
| **18** | **Adobe** | Global Enterprise & Cloud | 148 / 147 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **273** |
| **19** | **Visa** | Global FinTech / Payments | 145 / 145 | **Medium** | Array, String, Hash Table, Dynamic Programming | 30d, 3m, 6m, All | **270** |
| **20** | **Accenture** | Major Mass Placement / IT | 129 / 142 | **Medium** | Array, String, Math, Hash Table | 30d, 3m, 6m, All | **267** |
| **21** | **Nvidia** | Tier-1 Hardware & AI Compute | 136 / 139 | **Medium** | Array, Hash Table, String, Sorting | 30d, 3m, 6m, All | **264** |
| **22** | **Yandex** | Global Product Tech | 131 / 130 | **Medium** | Array, Hash Table, String, Two Pointers | 30d, 3m, 6m, All | **256** |
| **23** | **D. E. Shaw** | Top Quant / Hedge Fund | 116 / 105 | **Hard** | Array, Dynamic Programming, String, Hash Table | 30d, 3m, 6m, All | **241** |
| **24** | **Flipkart** | Top Indian Product Unicorn | 108 / 106 | **Hard** | Array, Hash Table, Dynamic Programming, Sorting | 30d, 3m, 6m, All | **233** |
| **25** | **PayPal** | Global FinTech / Payments | 103 / 103 | **Medium** | Array, String, Hash Table, Sorting | 30d, 3m, 6m, All | **228** |
| **26** | **Snowflake** | Cloud Data Warehousing | 101 / 102 | **Medium** | Array, String, Depth-First Search, Hash Table | 30d, 3m, 6m, All | **227** |
| **27** | **PhonePe** | Top Indian Product Unicorn | 95 / 100 | **Hard** | Array, Dynamic Programming, Hash Table, String | 30d, 3m, 6m, All | **225** |
| **28** | **Citadel** | Top Quant / Market Making | 87 / 89 | **Hard** | Array, Hash Table, String, Dynamic Programming | 30d, 3m, 6m, All | **214** |
| **29** | **Cisco** | Networking & Enterprise | 88 / 84 | **Medium** | Array, String, Hash Table, Two Pointers | 30d, 3m, 6m, All | **213** |
| **30** | **DoorDash** | Tier-1 Product Tech | 74 / 77 | **Hard** | Array, String, Breadth-First Search, Depth-First Search | 30d, 3m, 6m, All | **202** |

---

## 7. Data Quality & Gap Analysis

1. **Information Explicitly Available in Source:**
   - Problem titles and direct LeetCode URLs.
   - Per-question difficulty (Easy, Medium, Hard).
   - Frequency ratings and Acceptance % metrics.
   - Comprehensive technical Topic tags per question (Dataset 1).
   - Recency breakdown: Questions filtered by 30 days, 3 months, 6 months, and historical.
2. **Missing Information (Strictly Unfabricated):**
   - **Exact Salary / Package CTC:** Not present in LeetCode problem archives $\to$ Preserved as `null`.
   - **Specific Interview Round Schedules:** Not present in CSV archives $\to$ Preserved as `null`.
   - **Job Roles:** Generalized target placement roles (e.g., SDE, MTS) noted as candidate roles, but no specific job IDs or dates fabricated.

---

## 8. Recommended Architecture for TRAP Integration (Stage 2)

### A. Separation of Concerns: Global Reference Directory vs. User Pipeline
* **Global Reference Data (`reference_companies` or `company_intelligence`):**
  - Read-only master catalog populated with the 30 normalized companies, preparation topics, difficulty, and LeetCode problem counts.
  - Serves autocomplete in company creation and detailed intelligence cards (top topics, difficulty distribution).
* **User Tracked Company (`companies` table):**
  - Maintains existing multi-tenant user ownership model.
  - A user adding Google or Amazon tracks their individual application funnel state (`wishlist`, `applied`, `interviewing`, `offered`, `rejected`), user notes, applied dates, and salary expectations without affecting other users.

### B. Minimal Database Schema Evolution
* Extend `companies` or expose `GET /api/v1/companies/directory` from the structured Top 30 dataset so users can 1-click select top companies or input custom ones.
