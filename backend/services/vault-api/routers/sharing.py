"""
0711 Vault - Sharing API
Public links and collaborators
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import secrets
import logging

logger = logging.getLogger("vault.sharing")

router = APIRouter(prefix="/sharing", tags=["Sharing"])


# ===========================================
# SCHEMAS
# ===========================================

class ShareLinkCreate(BaseModel):
    item_id: Optional[str] = None
    album_id: Optional[str] = None
    encrypted_password: Optional[str] = None
    expires_in_hours: Optional[int] = None  # None = never
    max_downloads: Optional[int] = None
    allow_download: bool = True
    allow_preview: bool = True
    encrypted_message: Optional[str] = None

class ShareLinkResponse(BaseModel):
    id: str
    share_token: str
    share_url: str
    item_id: Optional[str]
    album_id: Optional[str]
    expires_at: Optional[datetime]
    max_downloads: Optional[int]
    download_count: int
    allow_download: bool
    allow_preview: bool
    created_at: datetime

class CollaboratorInvite(BaseModel):
    album_id: str
    email: Optional[EmailStr] = None
    user_id: Optional[str] = None
    can_view: bool = True
    can_add: bool = False
    can_remove: bool = False
    can_edit: bool = False
    can_share: bool = False
    encrypted_album_key: Optional[str] = None

class CollaboratorResponse(BaseModel):
    id: str
    album_id: str
    collaborator_email: Optional[str]
    collaborator_id: Optional[str]
    can_view: bool
    can_add: bool
    can_remove: bool
    can_edit: bool
    can_share: bool
    status: str
    invited_at: datetime
    accepted_at: Optional[datetime]


# ===========================================
# DEPENDENCIES
# ===========================================

async def get_db_pool():
    from main import db_pool
    if not db_pool:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db_pool

async def get_current_user(request: Request):
    from main import get_current_user as auth_user
    return await auth_user(request.headers.get("authorization"))

async def log_audit(db_pool, user_id: str, action: str, resource_type: str, 
                    resource_id: str, request: Request, details: dict = None):
    try:
        async with db_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO audit_log (user_id, action, resource_type, resource_id, 
                                       ip_address, user_agent, details)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """, user_id, action, resource_type, uuid.UUID(resource_id) if resource_id else None,
                request.client.host if request.client else None,
                request.headers.get("user-agent"),
                details)
    except Exception as e:
        logger.error(f"Audit log failed: {e}")


# ===========================================
# SHARE LINKS
# ===========================================

@router.post("/links", response_model=ShareLinkResponse)
async def create_share_link(
    share: ShareLinkCreate,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Create a public share link for an item or album."""
    logger.info(f"User {user_id} creating share link")
    
    if not share.item_id and not share.album_id:
        raise HTTPException(status_code=400, detail="Must specify item_id or album_id")
    
    async with db_pool.acquire() as conn:
        # Verify ownership
        if share.item_id:
            item = await conn.fetchrow(
                "SELECT id FROM vault_items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
                uuid.UUID(share.item_id), user_id
            )
            if not item:
                raise HTTPException(status_code=404, detail="Item not found")
        
        if share.album_id:
            album = await conn.fetchrow(
                "SELECT id FROM albums WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
                uuid.UUID(share.album_id), user_id
            )
            if not album:
                raise HTTPException(status_code=404, detail="Album not found")
        
        # Generate unique token
        share_token = secrets.token_urlsafe(32)
        
        # Calculate expiry
        expires_at = None
        if share.expires_in_hours:
            expires_at = datetime.utcnow() + timedelta(hours=share.expires_in_hours)
        
        # Create share link
        row = await conn.fetchrow("""
            INSERT INTO share_links 
            (user_id, share_token, item_id, album_id, encrypted_password, expires_at,
             max_downloads, allow_download, allow_preview, encrypted_message)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, share_token, item_id, album_id, expires_at, max_downloads,
                      download_count, allow_download, allow_preview, created_at
        """, user_id, share_token,
            uuid.UUID(share.item_id) if share.item_id else None,
            uuid.UUID(share.album_id) if share.album_id else None,
            share.encrypted_password, expires_at, share.max_downloads,
            share.allow_download, share.allow_preview, share.encrypted_message)
        
        result = dict(row)
        result['id'] = str(result['id'])
        result['item_id'] = str(result['item_id']) if result['item_id'] else None
        result['album_id'] = str(result['album_id']) if result['album_id'] else None
        result['share_url'] = f"https://vault.0711.io/s/{share_token}"
        
        await log_audit(db_pool, user_id, "share.create", "share", result['id'], request)
        
        logger.info(f"Share link created: {result['id']}")
        return result


@router.get("/links", response_model=List[ShareLinkResponse])
async def list_share_links(
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """List user's share links."""
    async with db_pool.acquire() as conn:
        links = await conn.fetch("""
            SELECT id, share_token, item_id, album_id, expires_at, max_downloads,
                   download_count, allow_download, allow_preview, created_at
            FROM share_links
            WHERE user_id = $1 AND revoked_at IS NULL
            ORDER BY created_at DESC
        """, user_id)
        
        results = []
        for row in links:
            r = dict(row)
            r['id'] = str(r['id'])
            r['item_id'] = str(r['item_id']) if r['item_id'] else None
            r['album_id'] = str(r['album_id']) if r['album_id'] else None
            r['share_url'] = f"https://vault.0711.io/s/{r['share_token']}"
            results.append(r)
        
        return results


@router.delete("/links/{link_id}")
async def revoke_share_link(
    link_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Revoke a share link."""
    logger.info(f"User {user_id} revoking share link {link_id}")
    
    async with db_pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE share_links SET revoked_at = NOW()
            WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL
        """, uuid.UUID(link_id), user_id)
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Share link not found")
        
        await log_audit(db_pool, user_id, "share.revoke", "share", link_id, request)
        
        return {"message": "Share link revoked"}


@router.get("/public/{share_token}")
async def access_share_link(
    share_token: str,
    password: Optional[str] = None,
    request: Request = None,
    db_pool = Depends(get_db_pool)
):
    """Access a shared item/album (public endpoint, no auth required)."""
    async with db_pool.acquire() as conn:
        link = await conn.fetchrow("""
            SELECT id, user_id, item_id, album_id, encrypted_password, expires_at,
                   max_downloads, download_count, allow_download, allow_preview,
                   encrypted_message
            FROM share_links
            WHERE share_token = $1 AND revoked_at IS NULL
        """, share_token)
        
        if not link:
            raise HTTPException(status_code=404, detail="Share link not found or revoked")
        
        # Check expiry
        if link['expires_at'] and link['expires_at'].replace(tzinfo=None) < datetime.utcnow():
            raise HTTPException(status_code=410, detail="Share link has expired")
        
        # Check max downloads
        if link['max_downloads'] and link['download_count'] >= link['max_downloads']:
            raise HTTPException(status_code=410, detail="Download limit reached")
        
        # Check password (client handles decryption, we just verify it was provided)
        if link['encrypted_password'] and not password:
            return {
                "requires_password": True,
                "allow_preview": link['allow_preview'],
                "message": link['encrypted_message']
            }
        
        # Update access stats
        await conn.execute("""
            UPDATE share_links 
            SET last_accessed_at = NOW(), download_count = download_count + 1
            WHERE id = $1
        """, link['id'])
        
        # Get shared content info
        if link['item_id']:
            item = await conn.fetchrow("""
                SELECT id, item_type, encrypted_metadata, storage_key, file_size, 
                       mime_type, captured_at
                FROM vault_items WHERE id = $1 AND deleted_at IS NULL
            """, link['item_id'])
            
            if not item:
                raise HTTPException(status_code=404, detail="Shared item no longer exists")
            
            return {
                "type": "item",
                "item": dict(item),
                "allow_download": link['allow_download'],
                "allow_preview": link['allow_preview'],
                "message": link['encrypted_message']
            }
        
        elif link['album_id']:
            album = await conn.fetchrow("""
                SELECT id, encrypted_name, encrypted_description, item_count
                FROM albums WHERE id = $1 AND deleted_at IS NULL
            """, link['album_id'])
            
            if not album:
                raise HTTPException(status_code=404, detail="Shared album no longer exists")
            
            # Get album items
            items = await conn.fetch("""
                SELECT v.id, v.item_type, v.encrypted_metadata, v.storage_key, 
                       v.file_size, v.mime_type, v.captured_at
                FROM album_items ai
                JOIN vault_items v ON ai.item_id = v.id
                WHERE ai.album_id = $1 AND v.deleted_at IS NULL
                ORDER BY ai.sort_order, v.captured_at DESC
                LIMIT 1000
            """, link['album_id'])
            
            return {
                "type": "album",
                "album": dict(album),
                "items": [dict(i) for i in items],
                "allow_download": link['allow_download'],
                "allow_preview": link['allow_preview'],
                "message": link['encrypted_message']
            }


# ===========================================
# COLLABORATORS
# ===========================================

@router.post("/collaborators", response_model=CollaboratorResponse)
async def invite_collaborator(
    invite: CollaboratorInvite,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Invite a collaborator to an album."""
    logger.info(f"User {user_id} inviting collaborator to album {invite.album_id}")
    
    if not invite.email and not invite.user_id:
        raise HTTPException(status_code=400, detail="Must specify email or user_id")
    
    async with db_pool.acquire() as conn:
        # Verify album ownership
        album = await conn.fetchrow(
            "SELECT id FROM albums WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
            uuid.UUID(invite.album_id), user_id
        )
        if not album:
            raise HTTPException(status_code=404, detail="Album not found")
        
        # Check if collaborator already exists
        existing = await conn.fetchrow("""
            SELECT id FROM collaborators
            WHERE album_id = $1 AND (collaborator_id = $2 OR collaborator_email = $3)
        """, uuid.UUID(invite.album_id), 
            uuid.UUID(invite.user_id) if invite.user_id else None,
            invite.email)
        
        if existing:
            raise HTTPException(status_code=409, detail="Collaborator already invited")
        
        # Create invitation
        row = await conn.fetchrow("""
            INSERT INTO collaborators 
            (album_id, owner_id, collaborator_id, collaborator_email,
             can_view, can_add, can_remove, can_edit, can_share, encrypted_album_key)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, album_id, collaborator_id, collaborator_email,
                      can_view, can_add, can_remove, can_edit, can_share,
                      status, invited_at, accepted_at
        """, uuid.UUID(invite.album_id), user_id,
            uuid.UUID(invite.user_id) if invite.user_id else None,
            invite.email, invite.can_view, invite.can_add, invite.can_remove,
            invite.can_edit, invite.can_share, invite.encrypted_album_key)
        
        result = dict(row)
        result['id'] = str(result['id'])
        result['album_id'] = str(result['album_id'])
        result['collaborator_id'] = str(result['collaborator_id']) if result['collaborator_id'] else None
        
        await log_audit(db_pool, user_id, "collaborator.invite", "album", invite.album_id, request,
                       {"collaborator_email": invite.email})
        
        # TODO: Send invitation email if email provided
        
        logger.info(f"Collaborator invitation created: {result['id']}")
        return result


@router.get("/collaborators/album/{album_id}", response_model=List[CollaboratorResponse])
async def list_album_collaborators(
    album_id: str,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """List collaborators for an album."""
    async with db_pool.acquire() as conn:
        # Verify access (owner or collaborator)
        has_access = await conn.fetchrow("""
            SELECT 1 FROM albums WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
            UNION
            SELECT 1 FROM collaborators WHERE album_id = $1 AND collaborator_id = $2 AND status = 'accepted'
        """, uuid.UUID(album_id), user_id)
        
        if not has_access:
            raise HTTPException(status_code=404, detail="Album not found")
        
        collaborators = await conn.fetch("""
            SELECT id, album_id, collaborator_id, collaborator_email,
                   can_view, can_add, can_remove, can_edit, can_share,
                   status, invited_at, accepted_at
            FROM collaborators
            WHERE album_id = $1
            ORDER BY invited_at
        """, uuid.UUID(album_id))
        
        results = []
        for row in collaborators:
            r = dict(row)
            r['id'] = str(r['id'])
            r['album_id'] = str(r['album_id'])
            r['collaborator_id'] = str(r['collaborator_id']) if r['collaborator_id'] else None
            results.append(r)
        
        return results


@router.post("/collaborators/{collab_id}/accept")
async def accept_collaboration(
    collab_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Accept a collaboration invitation."""
    async with db_pool.acquire() as conn:
        # Get invitation
        collab = await conn.fetchrow("""
            SELECT id, album_id, collaborator_id, collaborator_email
            FROM collaborators
            WHERE id = $1 AND status = 'pending'
        """, uuid.UUID(collab_id))
        
        if not collab:
            raise HTTPException(status_code=404, detail="Invitation not found")
        
        # Verify this invitation is for the current user
        # (by user_id or by email matching their account)
        user_email = await conn.fetchval("SELECT email FROM users WHERE id = $1", user_id)
        
        if collab['collaborator_id'] and str(collab['collaborator_id']) != user_id:
            raise HTTPException(status_code=403, detail="This invitation is for another user")
        if collab['collaborator_email'] and collab['collaborator_email'] != user_email:
            raise HTTPException(status_code=403, detail="This invitation is for another email")
        
        # Accept
        await conn.execute("""
            UPDATE collaborators 
            SET status = 'accepted', accepted_at = NOW(), collaborator_id = $1
            WHERE id = $2
        """, user_id, uuid.UUID(collab_id))
        
        await log_audit(db_pool, user_id, "collaborator.accept", "album", 
                       str(collab['album_id']), request)
        
        return {"message": "Collaboration accepted"}


@router.delete("/collaborators/{collab_id}")
async def remove_collaborator(
    collab_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Remove a collaborator (by album owner) or leave album (by collaborator)."""
    async with db_pool.acquire() as conn:
        collab = await conn.fetchrow("""
            SELECT c.id, c.album_id, c.collaborator_id, a.user_id as owner_id
            FROM collaborators c
            JOIN albums a ON c.album_id = a.id
            WHERE c.id = $1
        """, uuid.UUID(collab_id))
        
        if not collab:
            raise HTTPException(status_code=404, detail="Collaborator not found")
        
        # Allow removal by album owner or the collaborator themselves
        is_owner = str(collab['owner_id']) == user_id
        is_self = collab['collaborator_id'] and str(collab['collaborator_id']) == user_id
        
        if not is_owner and not is_self:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        await conn.execute("DELETE FROM collaborators WHERE id = $1", uuid.UUID(collab_id))
        
        action = "collaborator.remove" if is_owner else "collaborator.leave"
        await log_audit(db_pool, user_id, action, "album", str(collab['album_id']), request)
        
        return {"message": "Collaborator removed"}


@router.get("/collaborators/invitations")
async def list_my_invitations(
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """List pending collaboration invitations for current user."""
    async with db_pool.acquire() as conn:
        user_email = await conn.fetchval("SELECT email FROM users WHERE id = $1", user_id)
        
        invitations = await conn.fetch("""
            SELECT c.id, c.album_id, a.encrypted_name as album_name,
                   u.email as owner_email, c.can_view, c.can_add, c.can_remove,
                   c.can_edit, c.can_share, c.invited_at
            FROM collaborators c
            JOIN albums a ON c.album_id = a.id
            JOIN users u ON c.owner_id = u.id
            WHERE c.status = 'pending'
              AND (c.collaborator_id = $1 OR c.collaborator_email = $2)
            ORDER BY c.invited_at DESC
        """, user_id, user_email)
        
        return {"invitations": [dict(i) for i in invitations]}
