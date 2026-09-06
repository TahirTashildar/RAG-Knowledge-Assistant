from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central place for every configurable RAG value. Nothing chunk/embedding/
    retrieval related should be hard-coded elsewhere in the codebase — import
    from here instead.
    """

    huggingfacehub_api_token: str = ""
    huggingface_llm_model: str = "openai/gpt-oss-20b"
    huggingface_llm_task: str = "conversational"
    huggingface_provider: str = ""
    huggingface_embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    chroma_persist_directory: str = "./chroma_data"

    chunk_size: int = 1000
    chunk_overlap: int = 150
    top_k: int = 5

    internal_service_token: str = ""  # shared secret checked against Express's request header

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
