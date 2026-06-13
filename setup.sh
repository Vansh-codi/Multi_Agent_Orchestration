#!/usr/bin/env bash
# ================================================================
#  AgentOps — Developer setup script
#  Run once after cloning: bash setup.sh
# ================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
error() { echo -e "${RED}[error]${NC} $*"; exit 1; }

# ── 1. Check prerequisites ──────────────────────────────────────
info "Checking prerequisites..."
command -v python3 >/dev/null || error "Python 3.11+ is required. Install from https://python.org"
command -v node    >/dev/null || error "Node.js 20+ is required. Install from https://nodejs.org"
command -v docker  >/dev/null || warn  "Docker not found — you'll need it to run Postgres & Redis"

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
info "Python version: $PYTHON_VERSION"

# ── 2. Create .env from example ────────────────────────────────
if [ ! -f ".env" ]; then
  cp .env.example .env
  warn ".env created from .env.example — fill in your API keys before running the app!"
else
  info ".env already exists, skipping copy."
fi

# ── 3. Python virtual environment ──────────────────────────────
info "Creating Python virtual environment at backend/.venv ..."
python3 -m venv backend/.venv

info "Activating venv and installing Python dependencies..."
source backend/.venv/bin/activate

pip install --upgrade pip --quiet
pip install -r backend/requirements.txt

info "Python dependencies installed."

# ── 4. Node.js dependencies ────────────────────────────────────
info "Installing Node.js dependencies for frontend..."
cd frontend
npm install --silent
cd ..
info "Node.js dependencies installed."

# ── 5. VS Code: prompt to install extensions ───────────────────
if command -v code >/dev/null; then
  info "Installing recommended VS Code extensions..."
  jq -r '.recommendations[]' .vscode/extensions.json 2>/dev/null | while read -r ext; do
    code --install-extension "$ext" --force >/dev/null 2>&1 && echo "  + $ext" || true
  done
else
  warn "VS Code CLI (code) not found. Open VS Code and run:"
  warn "  Extensions panel → ... menu → Show Recommended Extensions → Install All"
fi

# ── 6. Print next steps ────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN} Setup complete! Next steps:${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "  1. Edit .env and add your API keys:"
echo "       OPENAI_API_KEY=sk-..."
echo "       SERPAPI_KEY=..."
echo ""
echo "  2. Start Postgres + Redis:"
echo "       docker compose up -d postgres redis"
echo ""
echo "  3. In VS Code, press F5 and choose 'FastAPI: dev server'"
echo "     OR run manually:"
echo "       source backend/.venv/bin/activate"
echo "       cd backend && uvicorn main:app --reload"
echo ""
echo "  4. In a second terminal, start the frontend:"
echo "       cd frontend && npm run dev"
echo ""
echo "  5. Open http://localhost:3000"
echo ""
