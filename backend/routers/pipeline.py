# P1-02 & P1-03: Pipeline Toggle API & Upload Webhook Trigger
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from middleware.edition_gate import requires_intelligence
import httpx
import json

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

class PipelineSettings(BaseModel):
    enabled: bool
    auto_extract: bool = True
    schema: str = "ETIM-9.0"
    webhook_url: str = "internal://ai-builder"

class ExtractionJob(BaseModel):
    file_id: str
    file_path: str
    tenant_id: str
    schema: str = "ETIM-9.0"

# In-memory settings (replace with DB)
PIPELINE_SETTINGS = {}

@router.get("/settings")
@requires_intelligence
async def get_pipeline_settings(tenant_id: str = "default"):
    """Get pipeline settings for tenant."""
    return PIPELINE_SETTINGS.get(tenant_id, {"enabled": False})

@router.put("/settings")
@requires_intelligence
async def update_pipeline_settings(settings: PipelineSettings, tenant_id: str = "default"):
    """Enable/disable pipeline for tenant."""
    PIPELINE_SETTINGS[tenant_id] = settings.dict()
    return {"status": "updated", "settings": settings}

@router.post("/trigger")
@requires_intelligence
async def trigger_extraction(job: ExtractionJob, background_tasks: BackgroundTasks):
    """Manually trigger extraction for a file."""
    background_tasks.add_task(process_extraction, job)
    return {"status": "queued", "file_id": job.file_id}

async def process_extraction(job: ExtractionJob):
    """Send file to AI Builder for extraction."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:9507/extract",  # AI Builder endpoint
                json={
                    "file_id": job.file_id,
                    "file_path": job.file_path,
                    "tenant_id": job.tenant_id,
                    "schema": job.schema,
                    "callback_url": f"http://localhost:9506/api/pipeline/callback/{job.file_id}"
                },
                timeout=30.0
            )
            return response.json()
    except Exception as e:
        print(f"Extraction trigger failed: {e}")
        return {"error": str(e)}

@router.post("/callback/{file_id}")
async def extraction_callback(file_id: str, result: dict):
    """Callback from AI Builder when extraction completes."""
    # Update file metadata with extraction result
    # Link Container to source file
    print(f"Extraction complete for {file_id}: {result.get(container_id)}")
    return {"status": "received"}

# Hook into file upload
async def on_file_uploaded(file_id: str, file_path: str, tenant_id: str):
    """Called when a file is uploaded. Triggers pipeline if enabled."""
    settings = PIPELINE_SETTINGS.get(tenant_id, {})
    
    if not settings.get("enabled"):
        return None
    
    if not settings.get("auto_extract", True):
        return None
    
    # Check file type (only process PDFs and images)
    if not any(file_path.lower().endswith(ext) for ext in [".pdf", ".png", ".jpg", ".jpeg"]):
        return None
    
    job = ExtractionJob(
        file_id=file_id,
        file_path=file_path,
        tenant_id=tenant_id,
        schema=settings.get("schema", "ETIM-9.0")
    )
    
    await process_extraction(job)
    return {"status": "extraction_triggered", "file_id": file_id}
