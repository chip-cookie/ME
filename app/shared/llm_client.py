"""
JasoS 통합 LLM 클라이언트
- OpenAI API key가 있으면 OpenAI 사용, 없으면 Ollama 사용
- 모든 모듈에서 이 클라이언트를 공유하여 LLM 접근 방식을 통일
"""
from app.core.config import get_settings
from app.shared.logger import get_logger

settings = get_settings()
logger = get_logger(__name__)


async def chat(prompt: str, system: str | None = None, json_mode: bool = False) -> str:
    """단일 턴 대화 (async). OpenAI 우선, 없으면 Ollama."""
    if settings.openai_api_key:
        return await _openai_chat(prompt, system)
    return await _ollama_chat(prompt, system, json_mode)


async def _openai_chat(prompt: str, system: str | None) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=messages
    )
    return response.choices[0].message.content


async def _ollama_chat(prompt: str, system: str | None, json_mode: bool) -> str:
    from ollama import AsyncClient
    client = AsyncClient(host=settings.ollama_base_url)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    kwargs = {"model": settings.ollama_model, "messages": messages}
    if json_mode:
        kwargs["format"] = "json"
    try:
        response = await client.chat(**kwargs)
        return response.message.content
    except Exception as e:
        logger.error(f"Ollama 호출 실패: {e}")
        raise


def sync_invoke(prompt: str) -> str:
    """동기 LLM 호출 (langchain Ollama 래퍼). analysis service 호환용."""
    from langchain_community.llms import Ollama
    llm = Ollama(
        base_url=settings.ollama_base_url,
        model=settings.ollama_model,
        temperature=0.1
    )
    return llm.invoke(prompt)
