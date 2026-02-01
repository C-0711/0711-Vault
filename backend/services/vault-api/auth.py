"""
Authentication dependency for 0711 Vault API
Extract user_id from Bearer token via Redis
"""

from fastapi import Header, HTTPException
import redis.asyncio as aioredis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Shared redis client (initialized on first use)
_redis_client = None


async def get_redis():
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = await aioredis.from_url(REDIS_URL)
    return _redis_client


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    Validate Bearer token and return user_id.
    Token is stored in Redis with key: token:{token} -> user_id
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = authorization.split(" ")[1]
    
    redis = await get_redis()
    user_id = await redis.get(f"token:{token}")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return user_id.decode()
