import base64
from functools import lru_cache
import tempfile

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_secret_key: str

    # PostgreSQL
    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str = "postgres"
    postgres_port: int = 5432

    # Redis
    redis_host: str = "redis"
    redis_port: int = 6379

    # Firebase
    firebase_credentials_b64: str | None = None
    firebase_credentials_path: str | None = None

    # Computed - not .env variables
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"

    def get_firebase_credentials_path(self) -> str:
        if self.firebase_credentials_b64:
            decoded = base64.b64decode(self.firebase_credentials_b64)
            tmp = tempfile.NamedTemporaryFile(mode="wb", suffix=".json", delete=False)
            tmp.write(decoded)
            tmp.close()
            return tmp.name
        
        if self.firebase_credentials_path:
            return self.firebase_credentials_path
        
        raise ValueError("No Firebase credentials configured")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
