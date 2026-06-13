

# backend/config.py
# ──────────────────────────────────────────────────────────────
#  Single source of truth for all configuration.
#  Every other module imports from here — never from os.environ directly.
# ──────────────────────────────────────────────────────────────
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    google_client_id: str | None = None
    google_client_secret: str | None = None
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"

    # Supabase
    supabase_url: str | None = None
    supabase_key: str | None = None
    # config.py — add to Settings class
    anthropic_api_key: str | None = None
    # App
    environment:              str = "development"
    log_level:                str = "INFO"
    max_agent_iterations:     int = 10
    code_exec_timeout_seconds: int = 10
   
    allowed_origins:          str = "http://localhost:3000"

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
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
    if len(settings.jwt_secret) < 32:
        raise ValueError("JWT_SECRET must be at least 32 characters")
    return Settings()