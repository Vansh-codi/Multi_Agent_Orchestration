# AgentOps — Multi-Agent Task Runner

LangGraph · FastAPI · Next.js 14 · PostgreSQL · Redis · GPT-4o

---

## What it does

You give it a goal in plain English. A Supervisor agent decomposes it into a
task DAG, routes subtasks to specialist agents (Planner, Researcher, Coder,
Critic), and streams live progress back to your browser over WebSocket.

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
- Copy `.env.example` → `.env` if it doesn't exist
- Install VS Code extensions automatically (if `code` CLI is available)

### Step 2 — Fill in your secrets

Open `.env` and add your API keys:

```
OPENAI_API_KEY=sk-...
SERPAPI_KEY=...
POSTGRES_PASSWORD=choose_a_strong_password
```

> `.env` is in `.gitignore` and will never be committed.

### Step 3 — Start everything

```bash
# Terminal 1 — start Postgres + Redis
docker compose up -d

# In VS Code — press F5 and pick "FastAPI: dev server"
# OR in Terminal 2:
source backend/.venv/bin/activate
cd backend && uvicorn main:app --reload

# In VS Code — press F5 and pick "Next.js: dev server"
# OR in Terminal 3:
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment variables

All secrets live in `.env` (root of the repo). Copy `.env.example` to get
started — it documents every variable with comments.

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | GPT-4o API key from platform.openai.com |
| `SERPAPI_KEY` | Yes | Web search key from serpapi.com |
| `POSTGRES_USER` | Yes | DB username (default: `agentops_user`) |
| `POSTGRES_PASSWORD` | Yes | DB password — make it strong |
| `POSTGRES_DB` | Yes | DB name (default: `agentops`) |
| `REDIS_URL` | Auto | Built from host/port — usually no change needed |
| `DATABASE_URL` | Auto | Built from Postgres vars — usually no change needed |
| `MAX_AGENT_ITERATIONS` | No | Safety ceiling on loops (default: 10) |

Frontend variables go in `frontend/.env.local` (copy from `frontend/.env.local.example`):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI base URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_WS_URL` | WebSocket base URL (default: `ws://localhost:8000`) |

---

## VS Code setup

The `.vscode/` folder is committed and shared with the team:

- **`settings.json`** — Python interpreter, format-on-save, linter config
- **`launch.json`** — F5 debug configs for FastAPI, Next.js, and pytest
- **`extensions.json`** — Recommended extensions (VS Code prompts to install these)

When you open the project VS Code will ask:
> "Do you want to install the recommended extensions?"

Click **Install All**. Key extensions:

| Extension | Purpose |
|---|---|
| `ms-python.python` | Python support |
| `charliermarsh.ruff` | Linting + formatting |
| `mikestead.dotenv` | `.env` syntax + secrets warning |
| `ms-azuretools.vscode-docker` | Docker integration |
| `humao.rest-client` | Test API endpoints from `.http` files |

---

## Project structure

```
agentops/
├── .env.example          ← document all vars here (safe to commit)
├── .env                  ← your real secrets (git-ignored)
├── .gitignore
├── setup.sh              ← one-command developer setup
├── docker-compose.yml    ← Postgres + Redis only
│
├── .vscode/
│   ├── settings.json     ← shared editor config
│   ├── launch.json       ← F5 debug configs
│   └── extensions.json   ← recommended extensions
│
├── backend/
│   ├── config.py         ← single Settings class reads .env
│   ├── main.py           ← FastAPI + WebSocket
│   ├── requirements.txt
│   ├── graph/
│   │   ├── state.py      ← AgentState TypedDict
│   │   ├── llm.py        ← LLM client (key from Settings)
│   │   ├── build_graph.py
│   │   ├── supervisor.py
│   │   └── agents/
│   │       ├── planner.py
│   │       ├── researcher.py
│   │       ├── coder.py
│   │       └── critic.py
│   ├── tools/
│   │   ├── web_search.py  ← SerpAPI key from Settings
│   │   └── code_executor.py
│   └── bus/
│       └── redis_bus.py   ← Redis URL from Settings
│
└── frontend/
    ├── .env.local.example ← document frontend vars
    ├── package.json
    └── app/
        ├── lib/api.ts     ← all URLs from env vars
        └── components/
            ├── GoalInput.tsx
            └── AgentFeed.tsx
```

---

## Security rules followed

1. **No secrets in source code** — every key is loaded from `.env` via `pydantic-settings`
2. **`.env` is git-ignored** — only `.env.example` (with fake values) is committed
3. **`docker-compose.yml` reads `${VAR}` from `.env`** — no inline passwords
4. **Frontend uses `NEXT_PUBLIC_` prefix correctly** — only non-secret URLs are browser-visible
5. **`config.py` is the single gateway** — all modules import `get_settings()`, never `os.environ` directly
6. **Code execution is sandboxed** — subprocess with `MAX_EXEC_TIME` timeout

---

## Deployment

| Service | Where to deploy | Environment vars |
|---|---|---|
| FastAPI backend | [Render](https://render.com) or [Railway](https://railway.app) | Set in dashboard — never in repo |
| Next.js frontend | [Vercel](https://vercel.com) | Set in project settings |
| Postgres | Render managed DB or Neon | Connection string as `DATABASE_URL` |
| Redis | Upstash (serverless Redis) | Connection URL as `REDIS_URL` |

On Vercel/Render you set the same env vars from your `.env` file in the platform's
dashboard. The code reads them identically — no changes needed.
