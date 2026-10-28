from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ELEXON_BASE_URL: str = "https://data.elexon.co.uk/bmrs/api/v1"
    CACHE_TTL_SECONDS: int = 1800  # 30 minutes
    # January 2026 scope
    SCOPE_START: str = "2026-01-01"
    SCOPE_END: str = "2026-01-31"
    # Gate closure: D-1 12:00 UTC (last NESO publish before this is 10:30 UTC)
    GATE_CLOSURE_HOUR: int = 12
    # HTTP timeout for Elexon API calls (seconds)
    HTTP_TIMEOUT: float = 60.0


settings = Settings()
