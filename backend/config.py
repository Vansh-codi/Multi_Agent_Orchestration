# backend/config.py
# ──────────────────────────────────────────────────────────────
#  Single source of truth for all configuration.
#  Every other module imports from here — never from os.environ directly.
# ──────────────────────────────────────────────────────────────
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path
ENV_FILE = Path(__file__).parent.parent / ".env"
class Settings(BaseSettings):

    # LLM
    groq_api_key: str
    jwt_secret: str

    # Database
    database_url: str
   
    # Optional postgres docker vars
    postgres_user:     str | None = None
    postgres_password: str | None = None
    postgres_db:       str | None = None
    postgres_host:     str | None = None
    postgres_port:     str | None = None

    # Redis
    redis_url: str

    # Optional redis docker vars
    redis_host: str | None = None
    redis_port: str | None = None

    # Search
    serpapi_key: str

    # Google OAuth
    google_client_id:     str | None = None
    google_client_secret: str | None = None
    backend_url:          str = "http://localhost:8000"
    frontend_url:         str = "http://localhost:3000"

    # Supabase
    supabase_url: str | None = None
    supabase_key: str | None = None

    # Anthropic
    anthropic_api_key: str | None = None

    # ── Orion waterfall providers (all optional) ──────────────────────────────
    # Waterfall order: Groq → Cerebras → Gemini → SambaNova → Together → HuggingFace → Ollama
    # Sign up links (all free):
    #   Cerebras   → cloud.cerebras.ai
    #   Gemini     → aistudio.google.com
    #   SambaNova  → cloud.sambanova.ai
    #   Together   → together.ai  ($25 free credit)
    #   HuggingFace→ huggingface.co
    #   Ollama     → local, no key needed — just run `ollama serve`
    cerebras_api_key:   str = ""
    gemini_api_key:     str = ""
    sambanova_api_key:  str = ""
    together_api_key:   str = ""
    huggingface_api_key: str = ""

    # App
    environment:               str = "development"
    log_level:                 str = "INFO"
    max_agent_iterations:      int = 10
    code_exec_timeout_seconds: int = 10
    allowed_origins:           str = "http://localhost:3000"

    model_config = SettingsConfigDict(
         env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
         extra="ignore",
    ) 

    @property
    def cookie_secure(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    settings = Settings()

    print("========== SETTINGS ==========")
    print("ENVIRONMENT:", settings.environment)
    print("FRONTEND_URL:", settings.frontend_url)
    print("BACKEND_URL:", settings.backend_url)
    print("COOKIE_SECURE:", settings.cookie_secure)
    print("ALLOWED_ORIGINS:", settings.allowed_origins)
    print("JWT_SECRET_LENGTH:", len(settings.jwt_secret))
    print("REDIS_URL_EXISTS:", bool(settings.redis_url))
    print("==============================")
    if len(settings.jwt_secret) < 32:
        raise ValueError("JWT_SECRET must be at least 32 characters")
    return settings
