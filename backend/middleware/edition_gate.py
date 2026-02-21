# P1-08: Feature Gate Middleware
from fastapi import Request, HTTPException
from functools import wraps

class VaultEdition:
    CORE = "core"
    INTELLIGENCE = "intelligence"
    ENTERPRISE = "enterprise"

def requires_intelligence(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Check tenant edition from request
        # For now, allow all - implement full check with DB
        return await func(*args, **kwargs)
    return wrapper

def requires_enterprise(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await func(*args, **kwargs)
    return wrapper
