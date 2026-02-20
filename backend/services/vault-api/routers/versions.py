"""
File Versioning API for 0711-Vault
Track and restore previous file versions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter(prefix="/versions", tags=["File Versioning"])

class Version(BaseModel):
    id: str
    file_id: str
    version_number: int
    size_bytes: int
    checksum: str
    created_at: datetime
    created_by: Optional[str] = None
    comment: Optional[str] = None

class VersionCreate(BaseModel):
    file_id: str
    comment: Optional[str] = None

# Storage
versions_db: dict = {}  # file_id -> list of versions

@router.get("/{file_id}", response_model=List[Version])
async def list_versions(file_id: str, limit: int = 50):
    """List all versions of a file"""
    file_versions = versions_db.get(file_id, [])
    return file_versions[-limit:]

@router.get("/{file_id}/{version_number}", response_model=Version)
async def get_version(file_id: str, version_number: int):
    """Get specific version"""
    file_versions = versions_db.get(file_id, [])
    for v in file_versions:
        if v["version_number"] == version_number:
            return Version(**v)
    raise HTTPException(status_code=404, detail="Version not found")

@router.post("/{file_id}/restore/{version_number}")
async def restore_version(file_id: str, version_number: int):
    """Restore file to a previous version"""
    file_versions = versions_db.get(file_id, [])
    target = None
    for v in file_versions:
        if v["version_number"] == version_number:
            target = v
            break
    
    if not target:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Create new version from restored content
    new_version = {
        "id": str(uuid.uuid4()),
        "file_id": file_id,
        "version_number": len(file_versions) + 1,
        "size_bytes": target["size_bytes"],
        "checksum": target["checksum"],
        "created_at": datetime.now(),
        "comment": f"Restored from version {version_number}",
    }
    
    file_versions.append(new_version)
    versions_db[file_id] = file_versions
    
    return {"status": "restored", "new_version": new_version["version_number"]}

@router.delete("/{file_id}/{version_number}")
async def delete_version(file_id: str, version_number: int):
    """Delete a specific version (admin only)"""
    file_versions = versions_db.get(file_id, [])
    
    if len(file_versions) <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete last version")
    
    versions_db[file_id] = [v for v in file_versions if v["version_number"] != version_number]
    return {"status": "deleted"}

@router.get("/{file_id}/diff/{v1}/{v2}")
async def compare_versions(file_id: str, v1: int, v2: int):
    """Compare two versions (metadata only)"""
    file_versions = versions_db.get(file_id, [])
    version1 = None
    version2 = None
    
    for v in file_versions:
        if v["version_number"] == v1:
            version1 = v
        if v["version_number"] == v2:
            version2 = v
    
    if not version1 or not version2:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {
        "file_id": file_id,
        "v1": {"number": v1, "size": version1["size_bytes"], "created": version1["created_at"]},
        "v2": {"number": v2, "size": version2["size_bytes"], "created": version2["created_at"]},
        "size_diff": version2["size_bytes"] - version1["size_bytes"],
        "checksum_match": version1["checksum"] == version2["checksum"],
    }
