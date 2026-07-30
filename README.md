# TRAP — Placement Preparation Operating System

> Stay Locked In Until You Succeed.

TRAP is a premium, centralized platform for students preparing for internships and campus placements. It replaces scattered spreadsheets, notes, and trackers with one intelligent workspace.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State | TanStack Query + Zustand |
| Routing | React Router v6 |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend | FastAPI + Python 3.12 |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.x (async) |
| Migrations | Alembic |
| Auth | JWT (access + refresh tokens) |

---

## Prerequisites

- Node.js >= 20.x
- Python 3.12.x
- PostgreSQL 15 or 16

---

## Quick Start

### 1. Clone and enter the repo
```bash
git clone <repo-url>
cd "TRAP ANTI"
```

### 2. Set up PostgreSQL
Create a database and user for TRAP:
```sql
CREATE USER trap_user WITH PASSWORD 'trap_password';
CREATE DATABASE trap_db OWNER trap_user;
```

### 3. Backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET_KEY
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend
```powershell
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 5. Open
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Architecture Docs

All architecture documents are in `docs/`:

- `implementation_plan.md` — MVP scope and MoSCoW prioritization
- `information_architecture.md` — Site map, routing, user journeys
- `design_system.md` — Colors, typography, spacing, tokens
- `database_schema.md` — Full PostgreSQL schema
- `api_contract.md` — REST API contract (51 endpoints)
- `folder_structure.md` — Directory organization

---

## Project Structure

```
TRAP ANTI/
├── backend/    FastAPI + SQLAlchemy backend
├── frontend/   React + Vite frontend
├── docs/       Architecture documentation
└── scripts/    Developer utilities
```
