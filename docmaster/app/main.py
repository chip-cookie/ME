import httpx
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.v1 import api_router

settings = get_settings()
logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.INFO, format="%(levelname)s [%(name)s] %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify vLLM container is reachable on startup
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.get(f"{settings.vllm_base_url}/v1/models")
            if r.status_code == 200:
                logger.info("vLLM container is ready: %s", settings.vllm_base_url)
            else:
                logger.warning("vLLM returned status %d", r.status_code)
    except Exception as exc:
        logger.warning("vLLM not reachable on startup: %s", exc)
    yield


app = FastAPI(
    title="DocMaster AI",
    description="로컬 LLM 기반 취업 문서 작성/평가/개선 시스템",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/api/v1/health", tags=["health"])
async def health():
    vllm_ok = False
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(f"{settings.vllm_base_url}/v1/models")
            vllm_ok = r.status_code == 200
    except Exception:
        pass
    return {
        "status": "ok",
        "vllm": "online" if vllm_ok else "offline",
        "model": settings.model_name,
    }
