import logging
from typing import Optional
import httpx
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Optional[Client]:
    """
    Get or create a Supabase client instance using configured environment variables.
    Returns None if SUPABASE_URL or SUPABASE_KEY are not configured.
    """
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        logger.warning("SUPABASE_URL or SUPABASE_KEY is not set. Supabase client will be uninitialized.")
        return None

    try:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        if hasattr(_supabase_client, "postgrest") and hasattr(_supabase_client.postgrest, "session"):
            _supabase_client.postgrest.session._transport = httpx.HTTPTransport(verify=False)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None
