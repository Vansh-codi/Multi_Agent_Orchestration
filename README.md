# AgentOps — Multi-Agent Task Runner

**LangGraph · FastAPI · Next.js 14 · PostgreSQL · Redis · Supabase · Groq**

You give it a goal in plain English. A Supervisor agent decomposes it into a task DAG, routes subtasks to specialist agents, and streams live progress back to your browser over WebSocket. Admins get a full control panel; regular users get a clean agent workspace with RAG, GitHub automation, and real-time execution logs.

---

## Features

- Multi-agent orchestration using LangGraph — Supervisor routes work across all agents
- Dynamic task planning that produces a dependency-aware DAG, not a flat list
- Web research via SerpAPI with per-user key override
- RAG pipeline — upload CSV, Excel, or images; agents query them automatically
- Secure Docker-sandboxed code execution across 7 languages
- Real-time WebSocket streaming — watch every agent step as it happens
- GitHub integration — repos, issues, branches, full file CRUD
- PostgreSQL memory + Redis Pub/Sub event bus
- Supabase file storage for all uploaded documents
- User authentication with JWT sessions and per-user API key vault
- Admin-only dashboard — live stats, user management, platform updates, maintenance mode
- User-facing Platform Updates page — release notes, maintenance banners, system status

---

## Who sees what

| Area                     | Regular user   | Admin                       |
| ------------------------ | -------------- | --------------------------- |
| Goal runner + agent feed | ✅             | ✅                          |
| File uploads + RAG       | ✅             | ✅                          |
| GitHub agent             | ✅             | ✅                          |
| Settings / API keys      | ✅             | ✅                          |
| Platform Updates page    | ✅ (read-only) | ✅ (create / edit / delete) |
| Maintenance banner       | ✅ (sees it)   | ✅ (controls it)            |
| Admin dashboard          | ❌             | ✅                          |
| User table               | ❌             | ✅                          |
| System health panel      | ❌             | ✅                          |
| Run statistics & charts  | ❌             | ✅                          |
| Activity logs            | ❌             | ✅                          |

---

## Architecture

```
User goal (plain English)
        │
        ▼
  Supervisor  ──────────────────────────────────────────────────┐
        │                                                        │
        ├─ Planner        builds the task DAG                   │
        │       │                                               │
        │       ▼                                               │
        ├─ Researcher     web search + RAG retrieval            │
        │       │                                               │
        │       ▼                                               │
        ├─ Coder          generates & executes code             │
        │       │         (Docker sandbox, 7 languages)         │
        │       ▼                                               │
        ├─ Critic         reviews, scores, requests rework      │
        │                                                        │
        └─ GitHub Agent   repo / issue / branch / file ops      │
                                                                 │
  Redis Pub/Sub ◄──────────────────────────────────────────────┘
        │
        ▼
  WebSocket stream → browser (live per-step updates)
```

Every inter-agent event is published on the Redis bus and forwarded over WebSocket so the UI reflects real-time progress.

---

## Researcher agent — how RAG fits in

The Researcher has two evidence sources, chosen automatically:

```
context_files attached?
        │
       YES ──► RAG retrieval (rag_retriever.py)
        │       Threshold set by user preference
        │       Web search is SKIPPED
        │
        NO ──► Web search via SerpAPI
                Uses user's own SerpAPI key if saved,
                falls back to system key
```

Both paths feed a structured prompt to the LLM (Groq llama-3.3-70b-versatile). The result is stored in the shared `results` dict, keyed by task ID, so downstream agents (Coder, Critic) can read it as dependency context.

---

## Admin dashboard

Only users with `role = "admin"` can access `/admin/*` routes (enforced server-side on every endpoint). The frontend hides the admin sidebar entry for non-admins.

### Stats cards (live, with yesterday deltas)

- Total users / new this week / active in last 24 min
- Runs today vs yesterday (% change)
- Success rate today vs yesterday
- Tokens used today vs yesterday
- Failures today vs yesterday

### Panels

| Panel       | What it shows                                         |
| ----------- | ----------------------------------------------------- |
| Overview    | All stat cards + 7-day run chart                      |
| Runs        | Last 100 agent runs — goal, status, tokens, timestamp |
| Users       | Last 100 registered users — name, email, role, joined |
| System      | Backend / DB / Storage / Cache health indicators      |
| Activity    | Last 20 activity log entries across all users         |
| Top Users   | Top 10 users ranked by run count                      |
| Updates     | Full CRUD for platform update posts                   |
| Maintenance | Toggle maintenance mode + set message                 |

### Platform Updates system

Admins create versioned update posts (feature / patch / maintenance / security / breaking). Each post has:

- Title, message, detailed notes
- Type, priority (low / medium / high), version string
- `active` toggle (show / hide without deleting)
- `show_banner` flag — when true, a scrolling neon marquee appears at the top of every page for all users

Regular users see the **Platform Updates** page with:

- Filterable update feed (All / Features / Patches / Maintenance / Security)
- Expandable cards with like / dislike voting
- Version history timeline sidebar
- System status widget (service + latency)
- Current version card

### Maintenance mode

Admin sets `maintenance_mode = true` + a message via `PATCH /admin/maintenance`. The frontend reads this and can gate access or display a banner to regular users.

---

## Quick start (3 steps)

### Step 1 — Clone and run setup

```bash
git clone https://github.com/you/agentops.git
cd agentops
bash setup.sh
```

`setup.sh` will:

- Create `backend/.venv` and install all Python packages
- Run `npm install` for the frontend
- Copy `.env.example` → `.env` if it does not exist
- Install VS Code extensions automatically (if `code` CLI is available)

### Step 2 — Fill in your secrets

Open `.env` and add your keys:

```env
GROQ_API_KEY=gsk-...
OPENAI_API_KEY=sk-...        # optional — Groq is the default
SERPAPI_KEY=...
POSTGRES_USER=agentops_user
POSTGRES_PASSWORD=choose_a_strong_password
POSTGRES_DB=agentops
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=...
```

`.env` is in `.gitignore` and will never be committed.

### Step 3 — Start everything

```bash
# Terminal 1 — Postgres + Redis
docker compose up -d

# Terminal 2 — FastAPI backend
source backend/.venv/bin/activate
cd backend && uvicorn main:app --reload

# Terminal 3 — Next.js frontend
cd frontend && npm run dev
```

Or use **F5** in VS Code and pick the matching launch config.

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

### Backend (`.env`)

| Variable               | Required | Description                                     |
| ---------------------- | -------- | ----------------------------------------------- |
| `GROQ_API_KEY`         | Yes      | Default LLM — llama-3.3-70b-versatile           |
| `OPENAI_API_KEY`       | No       | Optional fallback LLM                           |
| `SERPAPI_KEY`          | Yes      | System-level web search fallback                |
| `POSTGRES_USER`        | Yes      | DB username                                     |
| `POSTGRES_PASSWORD`    | Yes      | DB password                                     |
| `POSTGRES_DB`          | Yes      | DB name                                         |
| `SUPABASE_URL`         | Yes      | Supabase project URL                            |
| `SUPABASE_KEY`         | Yes      | Supabase service role key                       |
| `REDIS_URL`            | Auto     | Built from host/port                            |
| `DATABASE_URL`         | Auto     | Built from Postgres vars                        |
| `MAX_AGENT_ITERATIONS` | No       | Loop safety ceiling (default: `10`)             |
| `MAX_EXEC_TIME`        | No       | Code sandbox timeout in seconds (default: `30`) |

### Frontend (`frontend/.env.local`)

| Variable              | Description                                         |
| --------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_WS_URL`  | WebSocket base URL (default: `ws://localhost:8000`) |

---

## Authentication & API key vault

- Email / password signup and login (`routes/auth.py`)
- JWT session tokens
- Per-user API key storage (`routes/apikeys.py`) — users save their own:
  - Groq API key
  - SerpAPI key
  - GitHub personal access token
- Connection test endpoint (verify Groq key before running)
- Keys are stored per-user in the DB; the Researcher agent uses the user's SerpAPI key if present, falling back to the system key

---

## Slash commands

Type any of these at the goal input to skip the Supervisor and route directly:

| Command       | Agent called                          |
| ------------- | ------------------------------------- |
| `/planner`    | Planner only                          |
| `/researcher` | Researcher only (web or RAG)          |
| `/coder`      | Coder only                            |
| `/critic`     | Critic only                           |
| `/rag`        | RAG query against your uploaded files |
| `/git`        | GitHub agent                          |

---

## GitHub integration

Connect a personal access token in **Settings → API Keys**, then use the `/git` command or include GitHub tasks in any goal.

- List / create repositories
- Create / list issues
- Create / list branches
- Create, update, and delete files
- Full workflow automation (e.g. "create a repo, add a README, open an issue")

---

## Knowledge base & RAG

Upload files in the Files panel; attach one or more to any run as context.

**Supported formats:** CSV · XLSX · XLS · PNG · JPG · JPEG · WEBP · TIFF · BMP

**Pipeline:**

```
Upload → Extract text / OCR → Chunk → Embed → Vector index → Retrieve
```

When context files are attached to a run, the Researcher automatically queries them using the RAG retriever instead of hitting the web. The retrieval threshold is configurable per user in preferences.

Stats available at `/tools/stats` (document count, chunk count) and `/tools/jobs` (processing history).

---

## Secure code execution

Generated code runs inside an isolated Docker container (`Dockerfile.executor` + `tools/docker_executor.py`):

- Memory and CPU limits enforced by Docker
- No network access from inside the sandbox
- `MAX_EXEC_TIME` timeout kills runaway processes
- Separate executor module per language

**Supported languages:** Python · JavaScript · TypeScript · C · C++ · Go · Java

---

## Activity tracking

`activity.py` logs events to the `activity_logs` table automatically:

- Agent run started / completed / failed
- File indexed (CSV, OCR, Excel)
- GitHub events (repo created, issue opened, etc.)
- API key connected / updated

Admins view the live feed in the Activity panel. The log drives the admin stats delta calculations (today vs yesterday).

---

## VS Code setup

The `.vscode/` folder is committed and shared:

- `settings.json` — Python interpreter, format-on-save, Ruff linter
- `launch.json` — F5 configs for FastAPI, Next.js, and pytest
- `extensions.json` — recommended extensions (VS Code prompts on first open)

| Extension                     | Purpose                               |
| ----------------------------- | ------------------------------------- |
| `ms-python.python`            | Python support                        |
| `charliermarsh.ruff`          | Linting + formatting                  |
| `mikestead.dotenv`            | `.env` syntax highlighting            |
| `ms-azuretools.vscode-docker` | Docker integration                    |
| `humao.rest-client`           | Test API endpoints from `.http` files |

---

## Project structure

```
agentops/
├── .env.example
├── .env                          ← git-ignored
├── docker-compose.yml            ← Postgres + Redis
├── setup.sh
│
├── backend/
│   ├── config.py                 ← Settings (pydantic-settings, reads .env)
│   ├── main.py                   ← FastAPI app + WebSocket
│   ├── runner.py                 ← goal runner, wires context_files into state
│   ├── seed_rag.py
│   ├── Dockerfile.executor       ← isolated code execution image
│   ├── requirements.txt
│   │
│   ├── graph/
│   │   ├── state.py              ← AgentState TypedDict
│   │   ├── llm.py                ← LLM client (Groq default, per-user key)
│   │   ├── build_graph.py        ← LangGraph DAG assembly
│   │   ├── supervisor.py         ← routes tasks to agents
│   │   ├── rag_flow.py           ← RAG-only graph
│   │   ├── router.py             ← slash command routing
│   │   ├── memory/
│   │   │   └── postgres_memory.py
│   │   └── agents/
│   │       ├── planner.py
│   │       ├── researcher.py     ← RAG + web search, per-user SerpAPI key
│   │       ├── coder.py
│   │       ├── critic.py
│   │       └── github_agent.py
│   │
│   ├── routes/
│   │   ├── admin.py              ← /admin/* (role-gated)
│   │   ├── auth.py               ← signup / login / JWT
│   │   ├── apikeys.py            ← per-user key vault
│   │   ├── tools.py              ← RAG pipeline endpoints
│   │   ├── uploads.py            ← file upload handling
│   │   ├── generated_files.py    ← Supabase file serving
│   │   ├── github.py             ← GitHub proxy endpoints
│   │   ├── plan.py               ← task plan endpoints
│   │   ├── preferences.py        ← user preference CRUD
│   │   ├── system.py             ← system health
│   │   ├── updates.py            ← public platform updates feed
│   │   └── dependencies.py       ← get_current_user dependency
│   │
│   ├── services/
│   │   ├── activity.py           ← log_activity() helper
│   │   ├── cache.py              ← Redis caching helpers
│   │   ├── db.py                 ← asyncpg pool
│   │   ├── preferences.py        ← get_user_preferences()
│   │   ├── run_stats.py          ← token / run counters
│   │   └── suggestion.py
│   │
│   ├── storage/
│   │   └── supabase_storage.py
│   │
│   ├── tools/
│   │   ├── web_search.py         ← SerpAPI wrapper
│   │   ├── rag_retriever.py      ← vector search tool
│   │   ├── file_processors.py    ← CSV / Excel / OCR ingestion
│   │   ├── code_executor.py      ← dispatcher
│   │   ├── docker_executor.py    ← Docker sandbox
│   │   ├── github_auth.py
│   │   └── executors/
│   │       ├── c_executor.py
│   │       ├── cpp_executor.py
│   │       ├── go_executor.py
│   │       ├── java_executor.py
│   │       ├── js_executor.py
│   │       └── ts_executor.py
│   │
│   └── ws/
│       └── stream.py             ← WebSocket event pusher
│
└── frontend/
    ├── .env.local.example
    ├── package.json
    ├── tailwind.config.js
    └── app/
        ├── admin/                ← admin-only pages
        │   └── page.tsx
        ├── dashboard/
        │   └── page.tsx
        ├── login/
        │   └── page.tsx
        ├── signup/
        │   └── page.tsx
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
    └── components/
        └── agentops/
            ├── admin/
            │   ├── panels/
            │   │   ├── OverviewPanel.tsx
            │   │   ├── RunsPanel.tsx
            │   │   ├── SystemPanel.tsx
            │   │   └── UsersPanel.tsx
            │   ├── AdminCard.tsx
            │   ├── AdminDashboard.tsx
            │   ├── AdminHeader.tsx
            │   ├── AdminSidebar.tsx
            │   ├── AdminStats.tsx
            │   └── AdminTable.tsx
            ├── AgentFeed.tsx
            ├── AgentGraph.tsx
            ├── DashboardTabs.tsx
            ├── FilesPanel.tsx
            ├── GoalInput.tsx
            ├── GoalRunner.tsx
            ├── Hero.tsx
            ├── LogsPanel.tsx
            ├── MaintenancePage.tsx  ← platform updates + status (all users)
            ├── OutputTerminal.tsx
            ├── SettingsPage.tsx
            ├── Sidebar.tsx
            ├── StatusPanel.tsx
            ├── toolspage.tsx
            └── UploadPanel.tsx
```

---

## Security

- No secrets in source — every key loaded from `.env` via `pydantic-settings`
- `.env` is git-ignored; only `.env.example` (placeholder values) is committed
- `config.py` is the single gateway — all modules call `get_settings()`, never `os.environ`
- Admin routes check `user["role"] == "admin"` server-side on every request
- Code execution sandboxed in Docker — memory/CPU limits, no network
- Per-user file and key isolation — no cross-user data access
- `docker-compose.yml` reads `${VAR}` from `.env` — no inline passwords
- Frontend `NEXT_PUBLIC_` prefix used only for non-secret URLs

---

## Deployment

| Service          | Platform                  | Notes                            |
| ---------------- | ------------------------- | -------------------------------- |
| FastAPI backend  | Render or Railway         | Set env vars in dashboard        |
| Next.js frontend | Vercel                    | Set env vars in project settings |
| PostgreSQL       | Render managed DB or Neon | `DATABASE_URL`                   |
| Redis            | Upstash                   | `REDIS_URL`                      |
| File storage     | Supabase                  | `SUPABASE_URL` + `SUPABASE_KEY`  |

Set the same variables from your `.env` in each platform's dashboard. The code reads them identically — no code changes needed for production.
