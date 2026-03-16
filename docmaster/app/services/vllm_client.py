import os
from openai import AsyncOpenAI


class VLLMClient:
    def __init__(self, base_url: str = None, model: str = None):
        self.base_url = (base_url or os.getenv("VLLM_BASE_URL", "http://localhost:8000")) + "/v1"
        self.client = AsyncOpenAI(base_url=self.base_url, api_key="EMPTY")
        self.model = model or os.getenv("MODEL_NAME", "recruit-master")

    async def chat(
        self,
        system: str,
        user: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> str:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"} if json_mode else None,
        )
        return resp.choices[0].message.content
