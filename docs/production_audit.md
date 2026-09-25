# TRAP Production Functional Audit — Pre-Implementation Review

> **Audit Date:** August 28, 2026  
> **Auditor:** Staff Software Architect & Lead Security Engineer  
> **Status:** AUDIT COMPLETE — AWAITING USER APPROVAL PRIOR TO IMPLEMENTATION  
> **Scope:** Full-Stack Functional, Security, Database, API, State & Architecture Audit  

---

## 1. Executive Summary

TRAP (Placement Preparation Operating System) was audited across its entire stack: React/TypeScript frontend (Nothing OS Light Theme), FastAPI/SQLAlchemy async backend, and PostgreSQL database.

### Key Takeaways:
1. **Core Workflows Functional**: Authentication (JWT register, login, refresh), Goal Management (manual creation, 5-step workspace builder, topic library loading, topic status toggling, and goal deletion), Problem Tracker CRUD with filtering/pagination/bulk deletion, Company Pipeline tracking, and Settings/Profile management are functionally integrated with live database persistence.
2. **Analytics Module Missing**: The `Analytics` module exists only as empty placeholder folders in frontend (`src/features/analytics/`) and backend (`app/api/v1/analytics/`) without any registered API endpoints or frontend routes.
3. **Dashboard Calculation Inconsistencies**:
   - `problems_solved` in `GET /api/v1/dashboard/stats` counts **all** problem records in the database rather than filtering for `status == 'solved'`, artificially inflating the solved metrics when problems are marked `attempted`, `skipped`, or `revisit`.
   - `daily_goal_progress` is currently hardcoded to match total `problems_solved` rather than daily problem submissions.
4. **Timezone Offset in Activity Heatmap**: The frontend `ActivityHeatmap.tsx` derives dates using `date.toISOString().split('T')[0]` on local `Date` instances, causing a 1-day off-by-one mismatch for users in timezones east of UTC (e.g. UTC+05:30) when viewing late-evening activity.
5. **API Contract Inconsistencies**:
   - Authentication, Users, and Search endpoints wrap their responses in a top-level `{"data": ...}` envelope, whereas Problems, Companies, and Goals endpoints return raw models/arrays directly. The frontend handles this with inconsistent unwrapping logic (`data?.data ?? data`).
   - Trailing slash inconsistencies (`/api/v1/goals` redirects with `307 Temporary Redirect` to `/api/v1/goals/`) trigger unnecessary roundtrips on initial load.
6. **Overall Test Coverage**: Integration tests pass 100% (4 passed against PostgreSQL test schema, 74% backend coverage), but the test suite only tests basic happy paths and lacks unit/integration tests for Dashboard aggregation, Search, and error boundary states.

---

## 2. Architecture Summary

### Stack Overview
* **Frontend Framework:** React 18.3.1 with TypeScript 6.0.2 & Vite 8.1.4
* **UI/Design System:** Nothing OS Light Minimalist Design System (Space Grotesk headers, Geist Mono typography, custom CSS tokens in `tokens.css`, dot-matrix industrial accents, Tailwind CSS 3.4.19)
* **State Management:** Zustand 5.0.14 with `persist` middleware for session tokens and local devtools
* **Routing:** React Router DOM 6.30.4 (with `AuthGuard`, `GuestGuard`, `RootLayout`, `AppLayout`, and `AuthLayout`)
* **API Client:** Axios 1.18.1 with unified interceptors for JWT token injection and automatic 401 refresh queuing
* **Backend Framework:** FastAPI 0.115.0+ with Pydantic v2.9.2
* **ORM & Database:** SQLAlchemy 2.0.35 (AsyncIO) with `asyncpg` driver and PostgreSQL
* **Migrations:** Alembic 1.13.3 (7 completed revisions)
* **Auth & Security:** JWT (HS256) with 15-min access tokens, 30-day refresh tokens, Passlib bcrypt password hashing

---

## 3. Feature Inventory & Status Matrix

| Feature Module | Frontend Component(s) | Backend Endpoint(s) | Database Entities | State / Store | Status | Key Findings / Issues |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `LoginPage.tsx`, `RegisterPage.tsx` | `POST /auth/register`<br>`POST /auth/login`<br>`POST /auth/refresh`<br>`GET /auth/me` | `users` | `useAuthStore` | **PASS** | Functional with refresh token rotation and persistent storage. |
| **Dashboard** | `DashboardPage.tsx`, `StatCard.tsx`, `ActivityHeatmap.tsx`, `RecentActivity.tsx`, `QuickActions.tsx` | `GET /dashboard/stats`<br>`GET /dashboard/readiness` | `users`, `problems`, `companies`, `roadmaps`, `roadmap_topics` | Local state via `dashboard.ts` service | **PARTIAL** | `problems_solved` counts non-solved entries; timezone shift in heatmap client; `daily_goal_progress` hardcoded. |
| **Goals (Roadmaps)** | `GoalsPage.tsx`, `GoalView.tsx`, `GoalBuilder.tsx` (Steps 1–5) | `GET /goals/library`<br>`GET /goals/companies`<br>`POST /goals/`<br>`GET /goals/`<br>`GET /goals/{id}`<br>`PATCH /goals/{id}`<br>`DELETE /goals/{id}`<br>`PATCH /goals/topics/{id}/status` | `roadmaps`, `roadmap_categories`, `roadmap_topics` | `useGoalStore` | **PASS** | 5-step builder, topic library search/filters, topic status toggle with instant recalculation, and cascade deletion all work with ownership checks. |
| **Problems Tracker** | `ProblemsPage.tsx`, `ProblemModal.tsx`, `DifficultyBadge.tsx`, `StatusBadge.tsx` | `GET /problems/`<br>`POST /problems/`<br>`GET /problems/{id}`<br>`PUT /problems/{id}`<br>`DELETE /problems/{id}`<br>`POST /problems/bulk-delete` | `problems` | `useProblemStore` | **PASS** | Filtering (difficulty, status, search, bookmarks), pagination, modal editing, optimistic bookmark toggle, bulk deletion functional. |
| **Companies Tracker** | `CompaniesPage.tsx`, `CompanyModal.tsx`, `CompanyDetailsDrawer.tsx`, `CompanyStatusBadge.tsx` | `GET /companies/`<br>`POST /companies/`<br>`GET /companies/{id}`<br>`PUT /companies/{id}`<br>`DELETE /companies/{id}`<br>`POST /companies/bulk-delete` | `companies` | `useCompanyStore` | **PASS** | Status transitions, salary notes, interview dates, bulk deletion functional. |
| **Global Search** | `CommandPalette.tsx` | `GET /search/?q=...` | `problems`, `companies`, `roadmaps`, `roadmap_topics` | Local state in component (`trap-recent-searches`) | **PASS** | `Ctrl+K` & `/` keyboard navigation, debounced multi-entity query search, instant navigation targets. |
| **Profile & Settings** | `ProfilePage.tsx`, `SettingsPage.tsx`, `ProfileCard.tsx` | `GET /auth/me`<br>`PATCH /users/me`<br>`POST /users/me/change-password`<br>`GET /users/me/export`<br>`DELETE /users/me` | `users` | `useAuthStore` | **PASS** | Debounced autosave, structured JSON export, password update modal, and cascade account deletion. |
| **Analytics** | N/A (Empty directory) | N/A | N/A | N/A | **FAIL** | Not implemented. No frontend routes or backend endpoints exist. |

---

## 4. Goals — Deep Audit

The Goal system is a **manual, user-driven planning workspace** allowing students to assemble specific topics into customized preparation goals.

### 4.1 Goal Creation Flow
1. **Step 1 (Details):** User specifies Title, Description (optional), Target Role (select from software roles), Target Companies (multi-select), Target Deadline, and Daily Study Hours.
2. **Step 2 (Categories):** User selects focus areas (DSA, CS Fundamentals, Aptitude, Reasoning, Verbal) loaded from master topic libraries.
3. **Step 3 (Topic Selection & Filtering):**
   - Live search input filters topics by name and category.
   - Dropdown filter by difficulty (`all`, `easy`, `medium`, `hard`).
   - "Hot at [Company]" tag automatically displays if the topic is frequently asked by selected target companies (derived from `companyIntelligence`).
   - "Select All" and "Deselect All" toolbar actions accurately update `state.selectedTopics`.
4. **Step 4 (Milestone Organization):**
   - User can optionally group topics into drag-and-drop phases/milestones using `@dnd-kit`.
   - If skipped, Step 5 automatically organizes selected topics by their default categories.
5. **Step 5 (Review & Submission):**
   - Displays estimated completion days calculated from `totalHours / dailyStudyHours`.
   - Automated health checks identify missing deadlines or low topic counts.
   - Submits structured JSON payload to `POST /api/v1/goals/` and navigates to `GoalView`.

### 4.2 Progress Calculation Verification
* **Backend:** `GoalResponse` computed field `progress` in [backend/app/schemas/roadmap.py](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/backend/app/schemas/roadmap.py#L93-L105):
  $$\text{Progress} = \text{round}\left(\frac{\text{Completed Topics} + \text{Mastered Topics}}{\text{Total Selected Topics}} \times 100\right)$$
* **Frontend:** `useGoalStore.updateTopicStatus` in [frontend/src/store/goal.store.ts](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/frontend/src/store/goal.store.ts#L109-L113) mirrors the exact same logic optimistically.
* **Topic Status Options:** `not_started`, `bookmarked`, `in_progress`, `needs_revision`, `completed`, `mastered`, `skipped`. Only `completed` and `mastered` count towards the progress percentage.

### 4.3 Persistence & Ownership Verification
* **Logical Test Verified:**
  1. `POST /goals/` persists Goal, RoadmapCategories, and RoadmapTopics with foreign key relations.
  2. `PATCH /goals/topics/{id}/status` updates the status in `roadmap_topics` table.
  3. Browser refresh reloads `GET /goals/{id}` with `selectinload(Roadmap.categories).selectinload(RoadmapCategory.topics)`, preserving exact topic statuses, notes, and progress percentage.
  4. Ownership isolation: User B attempting to access `GET /goals/{goal_a_id}` or `PATCH /goals/topics/{topic_a_id}/status` receives `403 Forbidden` (`FORBIDDEN`).

### 4.4 Deletion Verification
* When a goal is deleted via `DELETE /api/v1/goals/{id}`, SQLAlchemy's `cascade="all, delete-orphan"` on `Roadmap.categories` and `RoadmapCategory.topics`, combined with Postgres `ON DELETE CASCADE` foreign keys, cleanly drops all child category and topic records without leaving orphaned rows.

---

## 5. Dashboard Verification

### 5.1 Placement Readiness Index (PRI)
* **Endpoint:** `GET /api/v1/dashboard/readiness`
* **Calculation:** Aggregates all topics across all **active** goals (`status == 'active'`). Computes $\frac{\text{completed}}{\text{total}} \times 100$.
* **Edge Case Handling:**
  - When user has 0 goals or 0 topics, safely returns `placement_readiness_index: 0`, empty strengths/weaknesses arrays, and placeholder focus text (`"Create a Goal to see your focus!"`).
  - Strengths and Deficient Sectors dynamically sort categories by completion percentage and return top 3 and bottom 3.

### 5.2 Problems Solved Count (Bug Identified — P1)
* **Code Location:** [backend/app/api/v1/dashboard/router.py](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/backend/app/api/v1/dashboard/router.py#L24-L26)
* **Finding:**
  ```python
  problems_stmt = select(func.count()).select_from(Problem).where(Problem.user_id == current_user.id)
  ```
  This queries `COUNT(*)` of all problem rows created by the user regardless of whether the problem is marked `solved`, `attempted`, `revisit`, or `skipped`.
* **Impact:** Any problem created is immediately counted as "Solved" on the dashboard even if its status is `attempted` or `revisit`.

### 5.3 Streak Calculation
* **Code Location:** [backend/app/api/v1/dashboard/router.py](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/backend/app/api/v1/dashboard/router.py#L84-L109)
* **Algorithm:** Queries unique problem submission dates grouped by `cast(Problem.created_at, Date)`.
  - Checks if the most recent date is `today` or `yesterday`. If not, streak is `0`.
  - Iterates backwards: if subsequent dates are consecutive ($d_{i+1} = d_i - 1\text{ day}$), increments streak counter. If gap $> 1$, breaks loop.
  - Multiple problems on the same day are deduped.
* **Finding:** Streak calculation logic is mathematically sound, but depends strictly on problem creation date (`Problem.created_at`) rather than a dedicated daily activity log.

### 5.4 Activity Heatmap Timezone Offset (Bug Identified — P2)
* **Code Location:** [frontend/src/components/dashboard/ActivityHeatmap.tsx](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/frontend/src/components/dashboard/ActivityHeatmap.tsx#L47-L48)
* **Finding:**
  `date.toISOString().split('T')[0]` converts local date objects to UTC before extracting the date string. In timezones east of GMT (such as IST UTC+05:30), dates between midnight and 05:30 AM local time convert to the previous calendar day in UTC, causing activity counts to render shifted by 1 cell.

### 5.5 Recent Activity Feed
* Merges the top 3 most recent problems and top 3 most recent companies, sorts by timestamp descending, and slices the top 3 events. Clean empty state rendered when 0 activity exists.

### 5.6 Quick Actions Navigation
* Actions link directly to `/app/problems`, `/app/companies`, and `/app/goals`. Functional and responsive.

---

## 6. Security Findings

| Vulnerability / Check | Status | Evidence / Analysis | Severity |
| :--- | :--- | :--- | :--- |
| **Authentication & Password Hashing** | **SECURE** | Uses `passlib.context.CryptContext` with `bcrypt` algorithm. Plaintext passwords never logged or stored. Minimum 8 characters enforced on register and password change. | Low Risk |
| **JWT Token Security** | **SECURE** | 15-minute access tokens with HS256 encryption. Refresh tokens (30 days) stored in localStorage and exchanged via `/api/v1/auth/refresh`. | Low Risk |
| **IDOR / Multi-Tenant Isolation (Goals)** | **SECURE** | Goal routes (`GET /{id}`, `PATCH /{id}`, `DELETE /{id}`) check `roadmap.user_id == current_user.id`. `PATCH /goals/topics/{topic_id}/status` resolves `category.roadmap_id` and checks ownership before allowing updates. | Low Risk |
| **IDOR / Isolation (Problems & Companies)** | **SECURE** | `ProblemRepository` and `CompanyRepository` scope all queries with `WHERE user_id = current_user.id`. Modifying or deleting non-owned records returns 404. | Low Risk |
| **Exception Traceback Leakage** | **SECURE** | `global_exception_handler` in `exceptions.py` intercepts unhandled exceptions, logs full tracebacks to stdout/logs, and returns generic `500 INTERNAL_SERVER_ERROR` with `details: null` to client. | Low Risk |
| **CORS Configuration** | **SECURE** | Reads `ALLOWED_ORIGINS` from environment, defaults to `http://localhost:5173`. Disallows wildcard origins when credentials enabled. | Low Risk |
| **SQL Injection** | **SECURE** | 100% of database queries use parameterized SQLAlchemy ORM statements. Search queries use `query_pattern = f"%{q}%"` passed safely to `.ilike()` parameters. | Low Risk |
| **Token in LocalStorage (XSS Exposure)** | **INFORMATIONAL** | JWT tokens are stored in `localStorage` under key `trap-auth-storage`. While standard for SPAs, migrating to `httpOnly` secure cookies is recommended for production enterprise hardening. | P3 |

---

## 7. API Audit Table

| Endpoint | Method | Purpose | Auth Required | Ownership Check | Validation Schema | Error Handling | Status |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/auth/register` | `POST` | User registration | No | N/A | `UserCreate` (email, password min 8) | 409 Conflict, 422 Validation | **PASS** |
| `/api/v1/auth/login` | `POST` | Authenticate & issue tokens | No | N/A | `LoginRequest` (email, password) | 401 Unauthorized | **PASS** |
| `/api/v1/auth/refresh` | `POST` | Refresh access token | No | N/A | `RefreshRequest` (refresh_token) | 401 Unauthorized | **PASS** |
| `/api/v1/auth/me` | `GET` | Get current user profile | Yes | Implicit (`current_user`) | Response: `UserResponse` | 401 Unauthorized | **PASS** |
| `/api/v1/dashboard/stats` | `GET` | Aggregate user dashboard stats | Yes | Implicit (`user_id` query filter) | Dict response | 401 Unauthorized | **PARTIAL** |
| `/api/v1/dashboard/readiness` | `GET` | Placement readiness index metrics | Yes | Implicit (`user_id` query filter) | Dict response | 401 Unauthorized | **PASS** |
| `/api/v1/users/me` | `PATCH` | Update profile attributes & prefs | Yes | Implicit (`current_user`) | `UserUpdate` | 401, 422 | **PASS** |
| `/api/v1/users/me/change-password` | `POST` | Change user password | Yes | Implicit (`current_user`) | `ChangePasswordRequest` | 401 Incorrect pwd, 400 len < 8 | **PASS** |
| `/api/v1/users/me/export` | `GET` | Structured JSON data export | Yes | Implicit (`current_user`) | Dict download payload | 401 Unauthorized | **PASS** |
| `/api/v1/users/me` | `DELETE` | Delete account & cascade data | Yes | Implicit (`current_user`) | Response message | 401 Unauthorized | **PASS** |
| `/api/v1/problems/` | `GET` | List problems with search/filter | Yes | Explicit (`user_id == user.id`) | Query params (limit $\le$ 500) | 401 Unauthorized | **PASS** |
| `/api/v1/problems/` | `POST` | Create problem entry | Yes | Explicit (`user_id = user.id`) | `ProblemCreate` | 401, 422 | **PASS** |
| `/api/v1/problems/{id}` | `GET` | Get specific problem details | Yes | Explicit (`user_id == user.id`) | UUID path | 401, 404 Not Found | **PASS** |
| `/api/v1/problems/{id}` | `PUT` | Update problem entry | Yes | Explicit (`user_id == user.id`) | `ProblemUpdate` | 401, 404 Not Found | **PASS** |
| `/api/v1/problems/{id}` | `DELETE` | Delete problem entry | Yes | Explicit (`user_id == user.id`) | UUID path | 401, 404 Not Found | **PASS** |
| `/api/v1/problems/bulk-delete` | `POST` | Bulk delete problems | Yes | Explicit (`user_id == user.id`) | `List[UUID]` payload | 401 Unauthorized | **PASS** |
| `/api/v1/companies/` | `GET` | List tracked companies | Yes | Explicit (`user_id == user.id`) | Query params (limit $\le$ 500) | 401 Unauthorized | **PASS** |
| `/api/v1/companies/` | `POST` | Create company entry | Yes | Explicit (`user_id = user.id`) | `CompanyCreate` | 401, 422 | **PASS** |
| `/api/v1/companies/{id}` | `GET` | Get specific company details | Yes | Explicit (`user_id == user.id`) | UUID path | 401, 404 Not Found | **PASS** |
| `/api/v1/companies/{id}` | `PUT` | Update company entry | Yes | Explicit (`user_id == user.id`) | `CompanyUpdate` | 401, 404 Not Found | **PASS** |
| `/api/v1/companies/{id}` | `DELETE` | Delete company entry | Yes | Explicit (`user_id == user.id`) | UUID path | 401, 404 Not Found | **PASS** |
| `/api/v1/companies/bulk-delete` | `POST` | Bulk delete companies | Yes | Explicit (`user_id == user.id`) | `List[UUID]` payload | 401 Unauthorized | **PASS** |
| `/api/v1/goals/library` | `GET` | Get master topics library | Yes | None (Public template data) | JSON array | 401 Unauthorized | **PASS** |
| `/api/v1/goals/companies` | `GET` | Get company prep templates | Yes | None (Public template data) | Dict template map | 401 Unauthorized | **PASS** |
| `/api/v1/goals/` | `POST` | Create custom goal roadmap | Yes | Explicit (`user_id = user.id`) | `GoalCreate` (nested categories/topics) | 401, 422 | **PASS** |
| `/api/v1/goals/` | `GET` | List user goals with progress | Yes | Explicit (`user_id == user.id`) | `List[GoalResponse]` | 401 Unauthorized | **PASS** |
| `/api/v1/goals/{id}` | `GET` | Get specific goal & topics | Yes | Explicit check (`roadmap.user_id == user.id`) | UUID path | 401, 403 Forbidden, 404 | **PASS** |
| `/api/v1/goals/{id}` | `PATCH` | Update goal metadata | Yes | Explicit check (`roadmap.user_id == user.id`) | `GoalUpdate` | 401, 403 Forbidden, 404 | **PASS** |
| `/api/v1/goals/{id}` | `DELETE` | Delete goal & all child topics | Yes | Explicit check (`roadmap.user_id == user.id`) | UUID path | 401, 403 Forbidden, 404 | **PASS** |
| `/api/v1/goals/topics/{id}/status` | `PATCH` | Update topic status & notes | Yes | Explicit check (via Category $\to$ Roadmap ownership) | `GoalTopicStatusUpdate` | 401, 403 Forbidden, 404 | **PASS** |
| `/api/v1/search/` | `GET` | Global instant search | Yes | Explicit (`user_id == user.id` on all 4 tables) | `q` query string (min 1 char) | 401 Unauthorized | **PASS** |

---

## 8. Database Findings

### 8.1 Schema & Models Inspection
* **PostgreSQL Native Types Maintained:** `UUID(as_uuid=True)` for all primary/foreign keys, `JSONB` for `target_companies` and `resource_links`, `TIMESTAMPTZ` for timestamps with timezone.
* **Foreign Key Constraints & Cascades:**
  - `problems.user_id` $\to$ `users.id` (`ON DELETE CASCADE`)
  - `companies.user_id` $\to$ `users.id` (`ON DELETE CASCADE`)
  - `roadmaps.user_id` $\to$ `users.id` (`ON DELETE CASCADE`)
  - `roadmap_categories.roadmap_id` $\to$ `roadmaps.id` (`ON DELETE CASCADE`)
  - `roadmap_topics.category_id` $\to$ `roadmap_categories.id` (`ON DELETE CASCADE`)
* **Indexes Verified:**
  - `users.email` (unique index)
  - `users.google_id` (unique index)
  - `problems.user_id`, `companies.user_id`, `roadmaps.user_id`, `roadmap_categories.roadmap_id`, `roadmap_topics.category_id` (indexed for query performance)
* **Alembic History:** All 7 migrations apply sequentially without schema drift.

---

## 9. Frontend State Audit

### 9.1 Zustand Stores & Cache Invalidation
1. **`useAuthStore`:** Stores `accessToken`, `refreshToken`, and `user`. Handled by `persist` middleware in `localStorage` under `trap-auth-storage`.
2. **`useGoalStore`:**
   - `updateTopicStatus` updates local state optimistically, recalculating goal progress immediately on client without needing full page refresh.
   - `createGoal` prepends new goal to `goals` array and sets `currentGoal`.
   - `deleteGoal` removes target goal from `goals` array.
3. **`useProblemStore`:**
   - `fetchProblems` supports parameter changes (difficulty, search, status, sort).
   - `toggleBookmark` optimistically flips bookmark state and reverts on API failure.
4. **`useCompanyStore`:**
   - Synchronizes company modifications and optimistic updates across drawer and table view.

### 9.2 Stale State Across Navigation (Identified Finding — P2)
* When navigating from `GoalView` (modifying topic status) back to `DashboardPage`, `DashboardPage` fetches fresh stats on mount (`useEffect`), but if the user relies on cached data without component remounting, dashboard PRI will not reflect topic changes until a fresh API call is made.

---

## 10. Mock Data Audit

A full-codebase regular expression search (`mock|dummy|fake|hardcoded|generateMockData`) revealed:
* **Backend:** **0** mock datasets in runtime API endpoints. Real database SQL aggregations used across all routers.
* **Frontend:**
  - [frontend/src/pages/app/ProfilePage.tsx:L40](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/frontend/src/pages/app/ProfilePage.tsx#L40): `goals_completed: 0, // Calculate later or mock as completed` (hardcoded 0).
  - [frontend/src/pages/app/goals/builder/GoalBuilder.tsx:L40-L48](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/frontend/src/pages/app/goals/builder/GoalBuilder.tsx#L40-L48): Static list of target roles (`Software Engineer`, `Frontend Developer`, etc.) and company names for onboarding suggestions.
  - [frontend/src/components/common/CommandPalette.tsx:L72-L153](file:///c:/Users/infaa/Desktop/TRAP%20ANTI/frontend/src/components/common/CommandPalette.tsx#L72-L153): Static list of default system actions when query string is empty.

---

## 11. Error, Loading & Empty State Matrix

| Page / Component | Skeleton Loading | Empty State | API Error State | Retry Action | Form Validation Feedback | Confirm Dialog |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard** (`DashboardPage`) | `DashboardSkeleton` | Inline fallback | `AlertCircle` screen | Reload button | N/A | N/A |
| **Problems** (`ProblemsPage`) | `ProblemsTableSkeleton` | `EmptyState` (icon, CTA) | Banner with retry | "Retry" button | Modal input validation | `ConfirmDialog` |
| **Companies** (`CompaniesPage`) | `CompaniesTableSkeleton` | `EmptyState` (icon, CTA) | Banner with retry | "Retry" button | Modal input validation | `ConfirmDialog` |
| **Goals List** (`GoalsPage`) | `GoalCardsSkeleton` | `EmptyState` (icon, CTA) | Banner | Page refresh | N/A | N/A |
| **Goal Workspace** (`GoalBuilder`) | Step transition | Empty list states | Alert message banner | Step navigation | Required field disables CTA | N/A |
| **Goal Details** (`GoalView`) | Custom pulse skeleton | N/A | Banner | Back link | Inline input validation | `ConfirmDialog` |
| **Profile** (`ProfilePage`) | `ProfileSkeleton` | N/A | `ErrorState` card | "Retry" button | N/A | N/A |
| **Settings** (`SettingsPage`) | `SettingsSkeleton` | N/A | Toast error feedback | Auto-retry | Floating label checks | `ConfirmDialog` |
| **Command Palette** | Spinner | "No results found" | "Search query failed" | Auto-retry on input | N/A | N/A |

---

## 12. Responsiveness & Functional Layout Audit

* **Desktop ($\ge$ 1024px):** Full sidebar (240px expanded / 68px collapsed), multi-column grids (4-column stat cards, 3-column goal cards, 2/3 + 1/3 dashboard layout).
* **Tablet (768px – 1023px):** 2-column stat cards, collapsible drawer menus, table horizontal scrolling with preserved action buttons.
* **Mobile (< 768px):** Hamburger header toggle, full slide-out `MobileNav` drawer with backdrop overlay, single-column stacked forms and cards, full touch target tap areas ($\ge 44\text{px}$). No horizontal viewport blowout.

---

## 13. Test Results & Build Status

### 13.1 Pytest Suite Execution
* **Command:** `pytest -v --cov=app`
* **Result:** **4 Passed, 0 Failed, 4 Deprecation Warnings** (FastAPI lifespan event syntax warning) in 10.56s.
* **Coverage:** **74% Total Code Coverage**
  - High Coverage: `app.schemas` (100%), `app.models` (100%), `app.api.v1.problems` (94%), `app.api.v1.companies` (91%), `app.core.exceptions` (83%), `app.api.v1.auth` (82%).
  - Low Coverage: `app.api.v1.dashboard.router` (16%), `app.api.v1.search.router` (38%), `app.repositories.roadmap` (45%).

### 13.2 Frontend Build & Lint Execution
* **TypeScript & Vite Build:** `tsc -b && vite build` $\to$ **0 Errors, 0 Warnings** (built in 1.67s).
* **Oxlint:** `npm run lint` $\to$ **18 minor linter warnings** (unused catch error variables, exhaustive hook dependencies in CommandPalette and ProfilePage).

---

## 14. Prioritized Issues

### P0 — Critical (Blockers & Security Vulnerabilities)
* *None identified.* Multi-tenant data isolation, password hashing, SQL injection prevention, and cascade deletions are functioning securely.

### P1 — High (Functional Inconsistencies & Broken Logic)
1. **Dashboard Solved Problems Counter Inaccuracy:** `GET /dashboard/stats` counts total problem rows instead of problems with `status == 'solved'`, reporting false solved progress.
2. **Missing Analytics Module:** `Analytics` feature is advertised in app documentation and folder structures, but possesses 0 routes and 0 endpoints.
3. **Hardcoded Dashboard Daily Target Progress:** `daily_goal_progress` in `GET /dashboard/stats` is assigned directly to `problems_solved` rather than measuring problems submitted today.

### P2 — Medium (UX Flaws & Edge Cases)
1. **Activity Heatmap Timezone Offset:** `ActivityHeatmap.tsx` converts local time to UTC using `.toISOString()`, shifting evening activity by -1 day in positive UTC timezones (e.g. IST).
2. **Profile Goals Completed Counter:** `ProfilePage.tsx` hardcodes `goals_completed: 0` rather than calculating completed goals from `GET /api/v1/goals`.
3. **API Response Envelope Inconsistency:** Auth/Users/Search endpoints return `{"data": ...}`, while Problems/Companies/Goals return raw models, requiring inconsistent frontend response unboxing.
4. **FastAPI Trailing Slash 307 Redirects:** Endpoints defined with trailing slashes (e.g. `/api/v1/goals/`) trigger 307 redirects when queried without slashes.

### P3 — Low (Minor Polish & Linter Cleanups)
1. **18 Oxlint React Hook & Catch Warnings:** Unused `err` variables in catch blocks and missing hook dependencies in `CommandPalette.tsx` and `ProfilePage.tsx`.
2. **FastAPI `@app.on_event` Deprecation:** Update startup/shutdown handlers to modern `lifespan` context manager syntax in `app/main.py`.
3. **Test Suite Expansion:** Add integration tests for Dashboard aggregations (`/dashboard/stats`, `/dashboard/readiness`) and Search (`/search`).

---

## 15. Recommended Fix Roadmap (Next Sprint)

1. **Step 1: Fix Dashboard Metrics Calculation**
   - Filter `Problem.status == 'solved'` in `GET /dashboard/stats`.
   - Calculate `daily_goal_progress` by counting problems created where `cast(Problem.created_at, Date) == date.today()`.
2. **Step 2: Fix Timezone Calculation in Heatmap & Profile Counters**
   - Use local calendar date formatting (`YYYY-MM-DD`) in `ActivityHeatmap.tsx` instead of `toISOString()`.
   - Compute `goals_completed` on `ProfilePage` from active user roadmaps.
3. **Step 3: Harmonize API Response Envelopes & Slashing**
   - Standardize response envelope across all endpoints to eliminate ad-hoc unboxing.
   - Configure router paths to handle both trailing and non-trailing slashes gracefully.
4. **Step 4: Implement or Formally Scope Analytics Module**
   - Either build dedicated Analytics endpoints (topic distribution, velocity, application conversion rate) or cleanly deprecate placeholder folders.
5. **Step 5: Expand Backend Test Suite & Clean Linter Warnings**
   - Add test cases for dashboard calculation edge cases, streak broken states, and global search.
   - Resolve 18 oxlint warnings across frontend components.
