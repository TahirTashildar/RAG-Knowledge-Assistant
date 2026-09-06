from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.language_models import BaseChatModel
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint

from app.config import settings

_SYSTEM_PROMPT = (
    "You are a careful research assistant. Answer strictly from the supplied "
    "document context and do not invent facts."
)


class HuggingFaceGenerationError(RuntimeError):
    """Raised when the configured Hugging Face chat model cannot generate text."""


def get_chat_client(temperature: float = 0.2) -> BaseChatModel:
    endpoint_kwargs = {
        "repo_id": settings.huggingface_llm_model,
        "task": settings.huggingface_llm_task,
        "huggingfacehub_api_token": settings.huggingfacehub_api_token,
        "max_new_tokens": 512,
        "temperature": temperature,
    }
    if settings.huggingface_provider:
        endpoint_kwargs["provider"] = settings.huggingface_provider

    endpoint = HuggingFaceEndpoint(**endpoint_kwargs)
    return ChatHuggingFace(llm=endpoint)


def _invoke(client: BaseChatModel, prompt: str) -> str:
    response = client.invoke(
        [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
    )
    content = response.content
    if isinstance(content, str) and content.strip():
        return content.strip()
    raise HuggingFaceGenerationError("Hugging Face returned an empty response")


def generate_answer(prompt: str, temperature: float = 0.2) -> str:
    if not settings.huggingfacehub_api_token:
        raise HuggingFaceGenerationError(
            "HUGGINGFACEHUB_API_TOKEN is not configured"
        )

    try:
        return _invoke(get_chat_client(temperature), prompt)
    except HuggingFaceGenerationError:
        raise
    except Exception as exc:
        raise HuggingFaceGenerationError(
            "Hugging Face chat generation failed for "
            f"{settings.huggingface_llm_model}: {exc}"
        ) from exc


def generate_alternative_queries(question: str, n: int = 3) -> list[str]:
    """Ask the same chat model for query variations used by multi-query retrieval."""
    instruction = (
        f"Generate {n} alternative phrasings of the following question, "
        "each capturing the same intent from a different angle. "
        "Return exactly one phrasing per line, with no numbering or extra text.\n\n"
        f"Question: {question}"
    )
    response = generate_answer(instruction, temperature=0.5)
    lines = [line.strip("-• \t") for line in response.splitlines() if line.strip()]
    return lines[:n] if lines else [question]
