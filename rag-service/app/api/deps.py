from fastapi import Header, HTTPException, status

from app.config import settings


def verify_internal_service(x_internal_token: str = Header(default="")) -> None:
    """
    FastAPI is never exposed to the browser. Express is the only caller, and it
    must attach this shared-secret header on every request. This does NOT replace
    user authentication (that already happened in Express) — it just proves the
    request came from our own backend and not an arbitrary client hitting the
    RAG service directly.
    """
    if not settings.internal_service_token:
        return  # allow local dev without a token configured
    if x_internal_token != settings.internal_service_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal service token")


def get_user_id(x_user_id: str = Header(...)) -> str:
    """
    Express resolves the JWT and passes the trusted userId here. FastAPI trusts
    this value ONLY because verify_internal_service already confirmed the caller
    is our own Express server. This userId is what gets used to filter every
    ChromaDB query — see Section 6 (strict user data isolation).
    """
    return x_user_id
