# TRAP — Company-Wise Placement Preparation Data Analysis Report
## Comprehensive Empirical Mapping of Companies, DSA Topics, Questions, and Cross-Company Overlap

> **Analysis Date:** August 29, 2026  
> **Source Repositories Analyzed:**  
> 1. `C:\Users\infaa\Downloads\leetcode-company-wise-problems-main` (Dataset 1: liquidslr / June 1, 2025)  
> 2. `C:\Users\infaa\Downloads\leetcode-companywise-interview-questions-master` (Dataset 2: snehasishroy / July 12, 2026)  
> **Target Production Dataset:** `backend/app/core/library/company_questions_seed.json` (3,137 normalized questions)

---

## 1. Executive Summary & Source Datasets

We analyzed both LeetCode company-wise interview preparation archives to extract the complete relational graph between **Target Companies $\to$ Technical DSA Topics $\to$ Specific Coding Questions $\to$ Difficulty & Recency**.

| Metric | Dataset 1 | Dataset 2 | Combined Normalized |
| :--- | :---: | :---: | :---: |
| **Total Company Folders** | **470** | **660** | **716 unique entities** |
| **Companies in Both Archives** | — | — | **414 cross-verified companies** |
| **Focus Target Subset** | Top 30 | Top 30 | **Top 30 Companies (100% in both)** |
| **Unique Technical Topics** | 171 | Included in DS1 | **171 Topics** |
| **Unique Coding Questions** | 3,082 | 2,986 | **3,137 Normalized Questions** |
| **Questions with Cross-Company Overlap** | — | — | **2,217 questions (70.7%)** |

---

## 2. Top 30 Companies & Folder Mappings

All Top 30 companies were cross-identified across both datasets using alias normalization:

| Rank | Company | Dataset 1 Folder | Dataset 2 Folder | Questions (DS1 / DS2) | Difficulty |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **1** | **Google** | `Google` | `google` | 2,344 / 2,325 | Medium |
| **2** | **Amazon** | `Amazon` | `amazon` | 2,011 / 1,988 | Medium |
| **3** | **Meta** | `Meta` | `meta` | 1,399 / 1,381 | Medium |
| **4** | **Microsoft** | `Microsoft` | `microsoft` | 1,384 / 1,386 | Medium |
| **5** | **Bloomberg** | `Bloomberg` | `bloomberg` | 1,223 / 1,213 | Medium |
| **6** | **Uber** | `Uber` | `uber` | 359 / 362 | Hard |
| **7** | **TikTok** | `TikTok` | `tiktok` | 348 / 349 | Medium |
| **8** | **Oracle** | `Oracle` | `oracle` | 299 / 313 | Medium |
| **9** | **Apple** | `Apple` | `apple` | 298 / 303 | Medium |
| **10** | **Goldman Sachs** | `Goldman Sachs` | `goldman-sachs` | 264 / 261 | Medium |
| **11** | **TCS** | `tcs` | `tcs` | 253 / 240 | Medium |
| **12** | **Infosys** | `Infosys` | `infosys` | 221 / 185 | Medium |
| **13** | **Salesforce** | `Salesforce` | `salesforce` | 193 / 191 | Hard |
| **14** | **IBM** | `IBM` | `ibm` | 173 / 178 | Medium |
| **15** | **LinkedIn** | `LinkedIn` | `linkedin` | 175 / 176 | Medium |
| **16** | **Zoho** | `Zoho` | `zoho` | 155 / 169 | Medium |
| **17** | **Walmart Labs** | `Walmart Labs` | `walmart-labs` | 152 / 143 | Medium |
| **18** | **Adobe** | `Adobe` | `adobe` | 148 / 147 | Medium |
| **19** | **Visa** | `Visa` | `visa` | 145 / 145 | Medium |
| **20** | **Accenture** | `Accenture` | `accenture` | 129 / 142 | Medium |
| **21** | **Nvidia** | `Nvidia` | `nvidia` | 136 / 139 | Medium |
| **22** | **Yandex** | `Yandex` | `yandex` | 131 / 130 | Medium |
| **23** | **D. E. Shaw** | `DE Shaw` | `de-shaw` | 116 / 105 | Hard |
| **24** | **Flipkart** | `Flipkart` | `flipkart` | 108 / 106 | Hard |
| **25** | **PayPal** | `PayPal` | `paypal` | 103 / 103 | Medium |
| **26** | **Snowflake** | `Snowflake` | `snowflake` | 101 / 102 | Medium |
| **27** | **PhonePe** | `PhonePe` | `phonepe` | 95 / 100 | Hard |
| **28** | **Citadel** | `Citadel` | `citadel` | 87 / 89 | Hard |
| **29** | **Cisco** | `Cisco` | `cisco` | 88 / 84 | Medium |
| **30** | **DoorDash** | `DoorDash` | `doordash` | 74 / 77 | Hard |

---

## 3. Technical DSA Topics Identified

A total of **171 unique technical topics** were extracted from the comma-separated `Topics` field in Dataset 1. The top 15 most frequent topics across the Top 30 companies are:

1. **Array** (7,114 occurrences)
2. **String** (2,958 occurrences)
3. **Hash Table** (2,777 occurrences)
4. **Dynamic Programming** (2,078 occurrences)
5. **Sorting** (1,876 occurrences)
6. **Math** (1,874 occurrences)
7. **Depth-First Search** (1,408 occurrences)
8. **Greedy** (1,306 occurrences)
9. **Binary Search** (1,275 occurrences)
10. **Two Pointers** (1,272 occurrences)
11. **Breadth-First Search** (1,207 occurrences)
12. **Matrix** (1,053 occurrences)
13. **Tree** (943 occurrences)
14. **Stack** (874 occurrences)
15. **Heap (Priority Queue)** (861 occurrences)

---

## 4. Cross-Company Question Overlap (Deduplication Intelligence)

A key architectural insight from the empirical analysis:
**70.7% (2,217 of 3,137) of all questions are asked by 2 or more target companies.**

| Companies Asking | Question Count | Percentage |
| :---: | :---: | :---: |
| **Asked by 1 Company** | 920 | 29.3% |
| **Asked by 2–4 Companies** | 1,177 | 37.5% |
| **Asked by 5–9 Companies** | 784 | 25.0% |
| **Asked by 10–19 Companies** | 218 | 7.0% |
| **Asked by 20–30 Companies** | 38 | 1.2% |

### Universal Questions (Asked by $\ge 28$ Companies)
* **Two Sum** (Easy): Asked by all **30 companies** (Google, Amazon, Meta, Microsoft, Bloomberg, TCS, Infosys, Uber, etc.).
* **Number of Islands** (Medium): Asked by all **30 companies**.
* **Best Time to Buy and Sell Stock** (Easy): Asked by **29 companies**.
* **LRU Cache** (Medium): Asked by **29 companies**.
* **Longest Palindromic Substring** (Medium): Asked by **28 companies**.
* **Valid Parentheses** (Easy): Asked by **28 companies**.

**Deduplication Strategy in TRAP:**
When a user selects multiple companies (e.g. Google + Amazon), TRAP displays **one single card** for *Two Sum*, tagged with:
`Asked by: Google · Amazon`
This prevents clutter while providing immediate multi-company context.

---

## 5. Company $\to$ Topic $\to$ Question Hierarchical Structure

Conceptually, the dataset maps cleanly into:

```
Company (e.g. Amazon)
  ├── Array
  │     ├── Two Sum (Easy) [Google, Amazon, Meta, ...]
  │     ├── 3Sum (Medium) [Amazon, Google, Meta, ...]
  │     └── ...
  ├── Dynamic Programming
  │     ├── Coin Change (Medium) [Amazon, Microsoft, ...]
  │     └── ...
  └── Trees
        ├── Binary Tree Level Order Traversal (Medium)
        └── ...
```

---

## 6. Data Quality & Gap Analysis

1. **Information Verified Present:**
   - Exact Question Title & canonical LeetCode URL (`https://leetcode.com/problems/...`).
   - Difficulty ratings (`Easy`, `Medium`, `Hard`).
   - Granular multi-topic taxonomy.
   - Company associations and interview frequency metrics.
2. **Missing Information (Strictly Unfabricated):**
   - **Exact CTC / Salary figures:** Not present in LeetCode datasets $\to$ preserved as `null`.
   - **Interview round timeline dates:** Preserved as `null`.
   - **Specific job posting IDs:** Preserved as `null`.

---

## 7. Recommended Database & Application Schema

* **Global Question Bank (`company_questions`):**
  Shared, read-only across all users. Seeded from `company_questions_seed.json` with idempotent upsert based on unique `slug`.
* **User Question Progress (`user_question_progress`):**
  User-scoped progress tracker (`user_id`, `question_id`, `status`, `notes`). Guaranteed multi-tenant isolation.
* **Goal Integration:**
  `roadmaps.target_companies` stores the list of target companies (e.g. `["Google", "Amazon"]`). When viewing a goal, TRAP joins `company_questions` matching any of the goal's target companies with the user's `user_question_progress`, yielding real-time completion percentages per company and per topic.
