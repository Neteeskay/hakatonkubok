from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Pomogat Prosto API"
    app_env: str = "local"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://pomogat:pomogat_dev@localhost:5432/pomogat_prosto"
    jwt_secret_key: str = "change-me-for-demo"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120
    uploads_dir: str = "./uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def sync_database_url(self) -> str:
        return self.database_url.replace("+asyncpg", "+psycopg")


settings = Settings()
