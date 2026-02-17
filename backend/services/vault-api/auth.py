"""
Authentication dependency for 0711 Vault API
Validates JWT tokens directly (no Redis lookup)
"""

from fastapi import Header, HTTPException
from jose import jwt, JWTError
import os

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"


async def get_current_user(authorization: str = Header(None)) -> str:
    """
    Validate Bearer token and return user_id.
    Decodes JWT directly to validate.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = authorization.split(" ")[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
