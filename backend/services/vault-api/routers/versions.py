"""
0711 Vault - Version History API
Track and restore file versions
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger("vault.versions")

router = APIRouter(prefix="/versions", tags=["Versions"])


# ===========================================
# SCHEMAS
# ===========================================

class VersionResponse(BaseModel):
    id: str
    item_id: str
    version_number: int
    storage_key: str
    file_size: int
    encrypted_metadata: Optional[str]
    created_by: str
    created_at: datetime
    is_current: bool

class RestoreRequest(BaseModel):
    version_id: str


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
# VERSION HISTORY
# ===========================================

@router.get("/item/{item_id}", response_model=List[VersionResponse])
async def list_item_versions(
    item_id: str,
    limit: int = Query(50, le=100),
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """List all versions of an item."""
    logger.info(f"User {user_id} listing versions for item {item_id}")
    
    async with db_pool.acquire() as conn:
        # Verify item ownership
        item = await conn.fetchrow("""
            SELECT id, storage_key FROM vault_items 
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
        """, uuid.UUID(item_id), user_id)
        
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        
        # Get versions
        versions = await conn.fetch("""
            SELECT id, item_id, version_number, storage_key, file_size,
                   encrypted_metadata, created_by, created_at
            FROM item_versions
            WHERE item_id = $1
            ORDER BY version_number DESC
            LIMIT $2
        """, uuid.UUID(item_id), limit)
        
        results = []
        current_storage_key = item['storage_key']
        
        for row in versions:
            r = dict(row)
            r['id'] = str(r['id'])
            r['item_id'] = str(r['item_id'])
            r['created_by'] = str(r['created_by'])
            r['is_current'] = (r['storage_key'] == current_storage_key)
            results.append(r)
        
        return results


@router.get("/{version_id}", response_model=VersionResponse)
async def get_version(
    version_id: str,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Get a specific version."""
    async with db_pool.acquire() as conn:
        version = await conn.fetchrow("""
            SELECT v.id, v.item_id, v.version_number, v.storage_key, v.file_size,
                   v.encrypted_metadata, v.created_by, v.created_at,
                   i.storage_key as current_storage_key
            FROM item_versions v
            JOIN vault_items i ON v.item_id = i.id
            WHERE v.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
        """, uuid.UUID(version_id), user_id)
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        result = dict(version)
        result['id'] = str(result['id'])
        result['item_id'] = str(result['item_id'])
        result['created_by'] = str(result['created_by'])
        result['is_current'] = (result['storage_key'] == result.pop('current_storage_key'))
        
        return result


@router.get("/{version_id}/download")
async def get_version_download_url(
    version_id: str,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Get presigned download URL for a specific version."""
    from storage import generate_download_url
    
    async with db_pool.acquire() as conn:
        version = await conn.fetchrow("""
            SELECT v.storage_key, v.version_number
            FROM item_versions v
            JOIN vault_items i ON v.item_id = i.id
            WHERE v.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
        """, uuid.UUID(version_id), user_id)
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        download_url = await generate_download_url(
            version['storage_key'],
            expires=timedelta(hours=1)
        )
        
        return {
            "download_url": download_url,
            "version_number": version['version_number'],
            "expires_in": 3600
        }


@router.post("/restore")
async def restore_version(
    restore: RestoreRequest,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Restore an item to a previous version."""
    logger.info(f"User {user_id} restoring version {restore.version_id}")
    
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # Get version and item info
            version = await conn.fetchrow("""
                SELECT v.id, v.item_id, v.version_number, v.storage_key, v.file_size,
                       v.encrypted_metadata, i.storage_key as current_storage_key,
                       i.file_size as current_file_size, i.encrypted_metadata as current_metadata
                FROM item_versions v
                JOIN vault_items i ON v.item_id = i.id
                WHERE v.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
            """, uuid.UUID(restore.version_id), user_id)
            
            if not version:
                raise HTTPException(status_code=404, detail="Version not found")
            
            # Don't restore if already current
            if version['storage_key'] == version['current_storage_key']:
                raise HTTPException(status_code=400, detail="This version is already current")
            
            # Get next version number
            max_version = await conn.fetchval("""
                SELECT COALESCE(MAX(version_number), 0) FROM item_versions
                WHERE item_id = $1
            """, version['item_id'])
            new_version_number = max_version + 1
            
            # Save current state as a new version first
            await conn.execute("""
                INSERT INTO item_versions 
                (item_id, version_number, storage_key, file_size, encrypted_metadata, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
            """, version['item_id'], new_version_number, version['current_storage_key'],
                version['current_file_size'], version['current_metadata'], user_id)
            
            # Update item to restored version
            await conn.execute("""
                UPDATE vault_items 
                SET storage_key = $1, file_size = $2, encrypted_metadata = $3, updated_at = NOW()
                WHERE id = $4
            """, version['storage_key'], version['file_size'], 
                version['encrypted_metadata'], version['item_id'])
            
            await log_audit(db_pool, user_id, "version.restore", "item", 
                           str(version['item_id']), request,
                           {"restored_version": version['version_number'],
                            "new_version": new_version_number})
            
            logger.info(f"Restored item {version['item_id']} to version {version['version_number']}")
            
            return {
                "message": f"Restored to version {version['version_number']}",
                "item_id": str(version['item_id']),
                "restored_version": version['version_number']
            }


@router.delete("/{version_id}")
async def delete_version(
    version_id: str,
    request: Request,
    user_id: str = Depends(get_current_user),
    db_pool = Depends(get_db_pool)
):
    """Delete a specific version (cannot delete current version)."""
    logger.info(f"User {user_id} deleting version {version_id}")
    
    async with db_pool.acquire() as conn:
        # Check version exists and isn't current
        version = await conn.fetchrow("""
            SELECT v.id, v.item_id, v.storage_key, v.version_number,
                   i.storage_key as current_storage_key
            FROM item_versions v
            JOIN vault_items i ON v.item_id = i.id
            WHERE v.id = $1 AND i.user_id = $2 AND i.deleted_at IS NULL
        """, uuid.UUID(version_id), user_id)
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        if version['storage_key'] == version['current_storage_key']:
            raise HTTPException(status_code=400, detail="Cannot delete current version")
        
        # Mark for deletion (actual cleanup happens via GC)
        await conn.execute("""
            UPDATE item_versions SET deleted_at = NOW()
            WHERE id = $1
        """, uuid.UUID(version_id))
        
        await log_audit(db_pool, user_id, "version.delete", "item", 
                       str(version['item_id']), request,
                       {"version_number": version['version_number']})
        
        return {"message": f"Version {version['version_number']} deleted"}


# ===========================================
# VERSION CREATION HELPER
# ===========================================

async def create_version_on_update(
    conn, 
    item_id: uuid.UUID, 
    user_id: str,
    old_storage_key: str,
    old_file_size: int,
    old_metadata: Optional[str]
):
    """
    Helper to create a version when an item is updated.
    Called by the vault router when an item's file is replaced.
    """
    max_version = await conn.fetchval("""
        SELECT COALESCE(MAX(version_number), 0) FROM item_versions
        WHERE item_id = $1
    """, item_id)
    
    new_version = max_version + 1
    
    await conn.execute("""
        INSERT INTO item_versions 
        (item_id, version_number, storage_key, file_size, encrypted_metadata, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
    """, item_id, new_version, old_storage_key, old_file_size, old_metadata, user_id)
    
    logger.info(f"Created version {new_version} for item {item_id}")
    return new_version
