"""
Authentication dependency for 0711 Vault API
Validates opaque Redis session tokens (matches main.py login flow)
"""

from fastapi import Header, HTTPException
import redis.asyncio as aioredis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

# Lazy-initialized Redis client
_redis_client = None


async def _get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(REDIS_URL)
    return _redis_client


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    Validate Bearer token and return user_id.
    Looks up opaque token in Redis (token:{token} -> user_id).
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")

    token = authorization.split(" ")[1]

    try:
        r = await _get_redis()
        user_id = await r.get(f"token:{token}")
        if user_id:
            return user_id.decode()
    except Exception:
        pass

    raise HTTPException(status_code=401, detail="Invalid or expired token")
