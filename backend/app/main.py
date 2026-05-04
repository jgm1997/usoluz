from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.redis import close_redis
from app.services.ree import ree_client

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Starting in {settings.app_env} mode")
    yield
    # Shutdown
    await close_redis()
    await ree_client.close()
    print("👋 Closing connections")


app = FastAPI(
    title="UsoLuz API",
    version="0.1.0",
    docs_url="/docs" if settings.app_env == "development" else None,
    lifespan=lifespan,
)


@app.get("/health")
async def get_health():
    return {"status": "ok", "env": settings.app_env}
