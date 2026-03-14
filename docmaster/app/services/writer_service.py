from app.services.vllm_client import VLLMClient
from app.prompts.writer_system import WRITER_SYSTEM_PROMPT, WRITER_USER_TEMPLATE
from app.prompts.style_guide import PUBLIC_STYLE_GUIDE, PRIVATE_STYLE_GUIDE
from app.prompts.gleaning_rewrite import GLEANING_SYSTEM_PROMPT, GLEANING_USER_TEMPLATE


class WriterService:
    GLEANING_SYSTEM_PROMPT = GLEANING_SYSTEM_PROMPT
    GLEANING_USER_TEMPLATE = GLEANING_USER_TEMPLATE

    def __init__(self, vllm: VLLMClient):
        self.vllm = vllm

    async def generate(
        self,
        jd_content: str,
        user_profile: str,
        org_type: str,
        doc_type: str,
        requirement_analysis: str,
        char_limits: str,
    ) -> str:
        style = PUBLIC_STYLE_GUIDE if org_type == "PUBLIC" else PRIVATE_STYLE_GUIDE
        system_prompt = WRITER_SYSTEM_PROMPT.format(
            org_type=org_type,
            doc_type=doc_type,
            style_guide=style,
        )
        user_prompt = WRITER_USER_TEMPLATE.format(
            jd_content=jd_content,
            requirement_analysis=requirement_analysis,
            user_profile=user_profile,
            doc_type=doc_type,
            char_limits=char_limits,
        )
        return await self.vllm.chat(system=system_prompt, user=user_prompt, temperature=0.7)
