"""
Authentication routes for 0711 Vault
Zero-knowledge auth: server never sees passwords or encryption keys
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import secrets

from config import settings
from database import get_db

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ===========================================
# SCHEMAS
# ===========================================

class RegisterRequest(BaseModel):
    email: EmailStr
    auth_hash: str  # Client-derived hash (NOT the password!)
    salt: str       # Client-generated salt
    encrypted_master_key: str  # Master key encrypted with password-derived key


class LoginRequest(BaseModel):
    email: EmailStr
    auth_hash: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class TwoFactorSetupRequest(BaseModel):
    auth_hash: str  # Verify identity


class TwoFactorVerifyRequest(BaseModel):
    code: str


# ===========================================
# ENDPOINTS
# ===========================================

@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db=Depends(get_db)):
    """
    Register a new user.
    
    Zero-Knowledge Flow:
    1. Client generates salt
    2. Client derives auth_hash from password + salt (PBKDF2)
    3. Client derives encryption_key from password + different salt
    4. Client encrypts master_key with encryption_key
    5. Client sends auth_hash, salt, encrypted_master_key
    6. Server NEVER sees password or encryption_key
    """
    # Check if user exists
    result = await db.execute(
        "SELECT id FROM users WHERE email = :email",
        {"email": request.email}
    )
    if result.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Store user (server-side hash of auth_hash for extra security)
    server_hash = pwd_context.hash(request.auth_hash)
    
    await db.execute("""
        INSERT INTO users (email, auth_hash, salt, encrypted_master_key)
        VALUES (:email, :auth_hash, :salt, :encrypted_master_key)
    """, {
        "email": request.email,
        "auth_hash": server_hash,
        "salt": request.salt,
        "encrypted_master_key": request.encrypted_master_key
    })
    
    # Generate tokens
    return _create_tokens(request.email)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db=Depends(get_db)):
    """
    Login and get tokens.
    """
    # Get user
    result = await db.execute(
        "SELECT id, auth_hash FROM users WHERE email = :email AND deleted_at IS NULL",
        {"email": request.email}
    )
    user = result.fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify auth hash
    if not pwd_context.verify(request.auth_hash, user.auth_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.execute(
        "UPDATE users SET last_login_at = NOW() WHERE id = :id",
        {"id": user.id}
    )
    
    return _create_tokens(request.email)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    """
    Refresh access token.
    """
    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        return _create_tokens(payload.get("sub"))
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/salt/{email}")
async def get_salt(email: str, db=Depends(get_db)):
    """
    Get user's salt for client-side key derivation.
    Required before login so client can derive auth_hash.
    """
    result = await db.execute(
        "SELECT salt FROM users WHERE email = :email AND deleted_at IS NULL",
        {"email": email}
    )
    user = result.fetchone()
    
    if not user:
        # Return random salt to prevent email enumeration
        return {"salt": secrets.token_hex(32)}
    
    return {"salt": user.salt}


@router.get("/master-key")
async def get_encrypted_master_key(email: str, db=Depends(get_db)):
    """
    Get user's encrypted master key.
    Only useful if user can decrypt it with their password.
    """
    result = await db.execute(
        "SELECT encrypted_master_key FROM users WHERE email = :email AND deleted_at IS NULL",
        {"email": email}
    )
    user = result.fetchone()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"encrypted_master_key": user.encrypted_master_key}


# ===========================================
# 2FA
# ===========================================

@router.post("/2fa/setup")
async def setup_2fa(request: TwoFactorSetupRequest, db=Depends(get_db)):
    """
    Enable 2FA for user.
    Returns TOTP secret for authenticator app.
    """
    # TODO: Implement TOTP setup
    pass


@router.post("/2fa/verify")
async def verify_2fa(request: TwoFactorVerifyRequest, db=Depends(get_db)):
    """
    Verify 2FA code.
    """
    # TODO: Implement TOTP verification
    pass


# ===========================================
# HELPERS
# ===========================================

def _create_tokens(email: str) -> TokenResponse:
    """Create access and refresh tokens."""
    now = datetime.utcnow()
    
    # Access token (short-lived)
    access_expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = jwt.encode(
        {"sub": email, "exp": access_expires, "type": "access"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    # Refresh token (long-lived)
    refresh_expires = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = jwt.encode(
        {"sub": email, "exp": refresh_expires, "type": "refresh"},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
