# V-12: File Versioning API
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import hashlib
import os

router = APIRouter(prefix="/files", tags=["versioning"])

class FileVersion(BaseModel):
    version_id: str
    file_id: str
    version_number: int
    size: int
    checksum: str
    created_at: datetime
    created_by: Optional[str]
    comment: Optional[str]
    is_current: bool

class VersionHistory(BaseModel):
    file_id: str
    filename: str
    total_versions: int
    versions: List[FileVersion]

# In-memory store (replace with DB in production)
VERSION_STORE: dict = {}

def generate_checksum(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

@router.post("/{file_id}/versions")
async def create_version(
    file_id: str,
    file: UploadFile = File(...),
    comment: Optional[str] = None,
    user_id: str = "system"
) -> FileVersion:
    """Create a new version of a file."""
    content = await file.read()
    checksum = generate_checksum(content)
    
    if file_id not in VERSION_STORE:
        VERSION_STORE[file_id] = {"filename": file.filename, "versions": []}
    
    # Mark all existing versions as not current
    for v in VERSION_STORE[file_id]["versions"]:
        v["is_current"] = False
    
    version_number = len(VERSION_STORE[file_id]["versions"]) + 1
    version_id = f"{file_id}_v{version_number}"
    
    new_version = FileVersion(
        version_id=version_id,
        file_id=file_id,
        version_number=version_number,
        size=len(content),
        checksum=checksum,
        created_at=datetime.utcnow(),
        created_by=user_id,
        comment=comment,
        is_current=True
    )
    
    VERSION_STORE[file_id]["versions"].append(new_version.dict())
    
    # Store the actual content (in production, use object storage)
    version_path = f"/tmp/versions/{version_id}"
    os.makedirs(os.path.dirname(version_path), exist_ok=True)
    with open(version_path, "wb") as f:
        f.write(content)
    
    return new_version

@router.get("/{file_id}/versions")
async def get_version_history(file_id: str) -> VersionHistory:
    """Get all versions of a file."""
    if file_id not in VERSION_STORE:
        raise HTTPException(status_code=404, detail="File not found")
    
    data = VERSION_STORE[file_id]
    return VersionHistory(
        file_id=file_id,
        filename=data["filename"],
        total_versions=len(data["versions"]),
        versions=[FileVersion(**v) for v in data["versions"]]
    )

@router.get("/{file_id}/versions/{version_id}")
async def get_version(file_id: str, version_id: str) -> FileVersion:
    """Get a specific version."""
    if file_id not in VERSION_STORE:
        raise HTTPException(status_code=404, detail="File not found")
    
    for v in VERSION_STORE[file_id]["versions"]:
        if v["version_id"] == version_id:
            return FileVersion(**v)
    
    raise HTTPException(status_code=404, detail="Version not found")

@router.post("/{file_id}/versions/{version_id}/restore")
async def restore_version(file_id: str, version_id: str, user_id: str = "system") -> FileVersion:
    """Restore a previous version (creates new version from old content)."""
    if file_id not in VERSION_STORE:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Find the version to restore
    target_version = None
    for v in VERSION_STORE[file_id]["versions"]:
        if v["version_id"] == version_id:
            target_version = v
            break
    
    if not target_version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Read the old content
    version_path = f"/tmp/versions/{version_id}"
    if not os.path.exists(version_path):
        raise HTTPException(status_code=404, detail="Version content not found")
    
    with open(version_path, "rb") as f:
        content = f.read()
    
    # Create new version with restored content
    for v in VERSION_STORE[file_id]["versions"]:
        v["is_current"] = False
    
    version_number = len(VERSION_STORE[file_id]["versions"]) + 1
    new_version_id = f"{file_id}_v{version_number}"
    
    restored = FileVersion(
        version_id=new_version_id,
        file_id=file_id,
        version_number=version_number,
        size=len(content),
        checksum=target_version["checksum"],
        created_at=datetime.utcnow(),
        created_by=user_id,
        comment=f"Restored from version {target_version[version_number]}",
        is_current=True
    )
    
    VERSION_STORE[file_id]["versions"].append(restored.dict())
    
    # Store restored content
    new_path = f"/tmp/versions/{new_version_id}"
    with open(new_path, "wb") as f:
        f.write(content)
    
    return restored

@router.delete("/{file_id}/versions/{version_id}")
async def delete_version(file_id: str, version_id: str):
    """Delete a specific version (cannot delete current version)."""
    if file_id not in VERSION_STORE:
        raise HTTPException(status_code=404, detail="File not found")
    
    versions = VERSION_STORE[file_id]["versions"]
    for i, v in enumerate(versions):
        if v["version_id"] == version_id:
            if v["is_current"]:
                raise HTTPException(status_code=400, detail="Cannot delete current version")
            versions.pop(i)
            # Clean up file
            version_path = f"/tmp/versions/{version_id}"
            if os.path.exists(version_path):
                os.remove(version_path)
            return {"status": "deleted", "version_id": version_id}
    
    raise HTTPException(status_code=404, detail="Version not found")
