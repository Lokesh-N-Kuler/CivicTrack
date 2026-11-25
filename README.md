# CivicTrack — Civic Grievance Reporting & Tracking Platform

[![Backend Tests](https://img.shields.io/badge/Pytest-30%20Passed-emerald.svg)](#testing-and-verification)
[![TypeScript](https://img.shields.io/badge/TypeScript-Vite%20Build%20Clean-blue.svg)](#frontend-architecture)
[![FastAPI](https://img.shields.io/badge/FastAPI-1.0.0-teal.svg)](http://127.0.0.1:8000/docs)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20SQLite%20Fallback-slate.svg)](#database-architecture)

**CivicTrack** is a full-stack civic grievance reporting and resolution platform engineered with modern principles of municipal transparency, automated department triage, immutable audit histories, and ethical government routing boundaries.

---

## Table of Contents

1. [Features](#features)
2. [Four Demonstration Departments](#four-demonstration-departments)
3. [Architecture & Tech Stack](#architecture--tech-stack)
4. [Folder Structure](#folder-structure)
5. [Prerequisites](#prerequisites)
6. [Quickstart Setup (PowerShell / Windows)](#quickstart-setup-powershell--windows)
7. [Demo Accounts & Evaluation Credentials](#demo-accounts--evaluation-credentials)
8. [Government Routing Protocol](#government-routing-protocol)
9. [Database Architecture & Fallback Protocol](#database-architecture--fallback-protocol)
10. [Testing and Verification](#testing-and-verification)
11. [Security Architecture & Production Deployment](#security-architecture--production-deployment)

---

## Features

- **Citizen Self-Service & Safety**: Secure citizen registration, login rate limiting, session management, and strict record isolation (citizens can *never* view or tamper with other citizens' private grievances).
- **Intelligent Department Recommendation**: Automated categorization logic recommending the appropriate department with human-readable rationale.
- **Unique CivicTrack Identifiers**: Thread-safe generation of formatted tracking IDs (e.g. `CT-2026-000001`).
- **Interactive OpenStreetMap Geotagging**: Map picker and viewer powered by Leaflet and OpenStreetMap.
- **Chronological Audit History**: Immutable status transitions with acting user attribution, timestamps, and field inspection notes.
- **Duplicate Grievance Detection**: AI-assisted similarity analysis based on category, text overlap, and Haversine geo-distance. Suggestions are presented for human verification; complaints are never automatically purged or merged.
- **Demo SLA Escalation Engine**: Automated flagging of overdue demonstration tickets (e.g., > 24 hours in progress) with prominent `Demo escalation rule` badges.
- **Operational Analytics Dashboard**: Computed entirely from database records using Recharts (department distributions, category pies, resolution timeline trends, average resolution time, and geographic heatmaps).
- **In-App Citizen Notifications**: Real-time feedback when grievances change status or when inspectors add notes.
- **Administrator Triage Console**: Administrative oversight, department corrections, priority changes, internal staff notes, and authority directory configuration.
- **Idempotent Data Seeder**: Built-in baseline demo data (8 fictional grievances across all 4 departments) with safe re-run capability.

---

## Four Demonstration Departments

CivicTrack includes four demonstration departments:

| Department | Covered Categories | Routing Triage Rationale |
| :--- | :--- | :--- |
| **1. Road Maintenance Department** | `potholes`, `damaged_roads`, `broken_road_surfaces` | Asphalt defects, potholes, roadbed deterioration, loose gravel, and pavement safety. |
| **2. Waste Management Department** | `garbage_accumulation`, `overflowing_bins`, `waste_collection` | Municipal solid waste, overflowing public bins, delayed curbside waste collection, and sanitation. |
| **3. Water Supply Department** | `water_leakage`, `damaged_pipelines`, `water_disruption` | Potable water distribution lines, pipeline ruptures, main valve shutdowns, and pressure disruptions. |
| **4. Drainage and Sewage Department** | `blocked_drains`, `sewage_overflow`, `waterlogging` | Storm drain silting, manhole wastewater backflow, culvert blockages, and street waterlogging abatement. |

> **Note**: Administrators can re-assign departments if a citizen's category was misclassified. All corrections are logged to the complaint history.

---

## Architecture & Tech Stack

```
Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
   │
   │  REST API (JSON over HTTP)
   ▼
Backend (Python 3.13 + FastAPI + Pydantic v2 + Alembic)
   │
   ├─► Security (BCrypt hashing, PyJWT, Rate Limiter)
   ├─► Services (Routing Engine, Duplicate Detector, Escalation Evaluator)
   │
   ▼
Database Layer (SQLAlchemy 2.0 ORM)
   ├── PostgreSQL (Normal Production Configuration)
   └── SQLite (Local Demonstration Fallback — clearly labeled, never silently disguised)
```

---

## Folder Structure

```
CivicTrack/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py               # Dependency injection & Auth guards
│   │   │   └── v1/
│   │   │       ├── auth.py           # Registration, login, rate limiting
│   │   │       ├── users.py          # Profile & citizen metrics
│   │   │       ├── departments.py    # Master departments & recommendations
│   │   │       ├── complaints.py     # Complaint CRUD, images, followup, triage
│   │   │       ├── authorities.py    # Municipal authority directory
│   │   │       ├── analytics.py      # Computed database chart metrics
│   │   │       ├── audit_logs.py     # Governance compliance trail
│   │   │       ├── notifications.py  # Citizen in-app notifications
│   │   │       └── demo.py           # Admin demo data reset
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic BaseSettings & env loading
│   │   │   ├── database.py           # Engine & session management (SQLite/Postgres)
│   │   │   ├── security.py           # Password hashing & JWT tokens
│   │   │   └── rate_limiter.py       # Sliding-window rate limiter
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   ├── schemas/                  # Pydantic validation schemas
│   │   ├── services/                 # Business logic, routing, duplicates, storage
│   │   ├── main.py                   # FastAPI application entrypoint
│   │   └── seed.py                   # Idempotent demo data seeder
│   ├── alembic/                      # Database migrations
│   ├── tests/                        # 30 comprehensive Pytest test cases
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/               # StatusBadge, PriorityBadge, Timeline, MapPicker, etc.
│   │   ├── context/                  # AuthContext, NotificationContext
│   │   ├── pages/                    # Landing, Login, Register, Dashboards, Detail, Analytics
│   │   ├── services/                 # API client & TypeScript interfaces
│   │   ├── App.tsx                   # Declarative routing & layout
│   │   ├── main.tsx
│   │   └── index.css                 # Tailwind directives & theme
│   ├── package.json
│   ├── vite.config.ts                # Proxying /api to FastAPI backend
│   └── tailwind.config.js
├── scripts/                          # Automated startup & test scripts (PowerShell)
└── README.md
```

---

## Prerequisites

- **Python**: Version 3.10 to 3.13
- **Node.js**: Version 18 or higher (tested on Node v24.15.0)
- **PowerShell**: Windows PowerShell 5.1+ or PowerShell Core 7+

---

## Quickstart Setup (PowerShell / Windows)

Open a PowerShell terminal in `d:\CivicTrack`:

### 1. Backend Setup & Startup

```powershell
# Navigate to backend
cd d:\CivicTrack\backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Run database migrations
.\venv\Scripts\alembic.exe upgrade head

# Seed demo dataset (idempotent, safe to run multiple times)
python -m app.seed

# Start backend server (Uvicorn)
.\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```

*The backend runs at `http://127.0.0.1:8000`. Interactive Swagger API docs are available at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup & Startup

Open a second PowerShell terminal:

```powershell
# Navigate to frontend
cd d:\CivicTrack\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

*The frontend opens at `http://localhost:5173`.*

---

## Demo Accounts & Evaluation Credentials

For rapid local evaluation, three accounts are pre-seeded with one-click demo login buttons on the login screen:

| Role | Email Address | Password | Intended Evaluation Workflow |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@example.com` | `AdminPassword123!` | Accesses Admin Dashboard, Analytics, Department Reassignment, Triage, and Audit Logs. |
| **Citizen (Alex)** | `citizen@example.com` | `Password123!` | Submits new grievances, views their own reports, posts follow-up notes, and records official references. |
| **Citizen (Priya)** | `priya.citizen@example.com` | `Password123!` | Used to verify privacy isolation (Alex cannot view Priya's grievances). |

> **IMPORTANT WARNING**: Replace demo credentials prior to deploying in any production environment. Do not create default administrative accounts with default passwords in production.

---

## Government Routing Protocol

CivicTrack adheres to strict boundaries regarding external municipal portals:

1. **No Fraudulent Dispatches**: CivicTrack never fabricates external government responses or claims that an actual municipal office has accepted a complaint when it has not.
2. **Official Summary Generation**: For verified or unverified portals, CivicTrack generates a pre-formatted, polite summary containing the internal ID, address, GPS coordinates, category, and description for the citizen to copy and paste directly into the official portal (e.g. CPGRAMS, Swachhata, BBMP Sahaaya).
3. **Simulated Adapter Notice**: All simulated adapters clearly display:
   ```
   SIMULATED — NOT SENT TO GOVERNMENT
   ```
4. **Citizen-Reported References**: Reference numbers entered by citizens are stored separately from internal CivicTrack IDs and cataloged as `Unverified` until administrative confirmation.

---

## Database Architecture & Fallback Protocol

- **Normal Production Configuration**: PostgreSQL via `postgresql+psycopg2://user:password@localhost:5432/civictrack`. Set `DATABASE_URL` in `backend/.env`.
- **Local Fallback**: SQLite (`sqlite:///./civictrack.db`) is provided for immediate out-of-the-box local testing when PostgreSQL is not configured.
- **Honesty Principle**: CivicTrack never pretends SQLite is PostgreSQL. The `/health` and `/` endpoints explicitly report whether SQLite fallback or PostgreSQL is in use.

---

## Testing and Verification

All backend workflows are covered by automated tests in `backend/tests/`:

```powershell
cd d:\CivicTrack\backend
.\venv\Scripts\pytest.exe -v
```

### Test Results Summary:
- `test_register_citizen_success`: Verified citizen creation with hashed credentials.
- `test_register_duplicate_email_fails`: 400 Bad Request on duplicate emails.
- `test_login_success` & `test_login_invalid_password_fails`: Verified JWT authentication and rejection of invalid passwords.
- `test_protected_endpoint_without_token_fails`: 401 Unauthorized when unauthenticated.
- `test_all_department_recommendations`: Verified automated recommendation for all 12 categories across all 4 departments.
- `test_citizen_create_complaint_and_routing`: Automatic `CT-YYYY-NNNNNN` generation, routing, and timeline creation.
- `test_citizen_cannot_view_another_citizens_private_complaint`: Verified 403 Forbidden on cross-citizen access.
- `test_admin_can_view_any_complaint`: Verified administrative oversight.
- `test_admin_status_update_records_history`: Verified history recording on status transitions.
- `test_citizen_cannot_perform_admin_update`: 403 Forbidden when citizen attempts administrative changes.
- `test_simulated_government_submission_contains_required_disclaimer`: Verified presence of `SIMULATED — NOT SENT TO GOVERNMENT`.
- `test_record_citizen_official_submission_starts_unverified`: Verified that citizen-entered references start unverified.
- `test_analytics_overview_computes_from_db`: Real database query computation for charts and resolution time.
- `test_reset_demo_data_endpoint`: Admin-only demo data reset.

**Total**: 30 Passed, 0 Failed.

### Frontend Build Verification:
```powershell
cd d:\CivicTrack\frontend
npm run build
```
Result: 0 errors; production bundle compiled in `dist/`.

---

## Security Architecture & Production Deployment

1. **Password Security**: Passwords are encrypted using modern `bcrypt` with work factor 12.
2. **Access Tokens**: Stateless HS256 JWT tokens with 24-hour expiration.
3. **CORS Control**: Configurable via `BACKEND_CORS_ORIGINS` in `.env`.
4. **File Storage**: Uploaded images are checked against size limits (5MB) and MIME magic headers. Filenames are randomized with UUIDs, and paths are strictly confined to prevent directory traversal.
5. **Rate Limiting**: Sliding-window rate limiter on login endpoints.
6. **Data Isolation**: Database queries enforce `citizen_id` scoping on non-admin users.
