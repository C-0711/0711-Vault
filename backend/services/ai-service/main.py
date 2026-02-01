"""
0711 AI Service
Face detection, embeddings, OCR, and image processing
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
from typing import Optional, List
import os
import io
import httpx
import base64
import json
from datetime import datetime

# Optional imports - graceful degradation
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️ OpenCV not available - face detection disabled")

try:
    import mediapipe as mp
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False
    print("⚠️ MediaPipe not available - face detection disabled")

try:
    from PIL import Image
    import pillow_heif
    pillow_heif.register_heif_opener()
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("⚠️ Pillow not available - image processing limited")

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("⚠️ Tesseract not available - OCR disabled")

# Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://vault:vault@localhost:5432/vault")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "bge-m3:latest")
VISION_MODEL = os.getenv("VISION_MODEL", "llama4:latest")

# Initialize MediaPipe face detection
face_detection = None
if MP_AVAILABLE:
    mp_face_detection = mp.solutions.face_detection
    face_detection = mp_face_detection.FaceDetection(
        model_selection=1,  # 0 for close range, 1 for full range
        min_detection_confidence=0.5
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting 0711 AI Service...")
    print(f"   OpenCV: {'✅' if CV2_AVAILABLE else '❌'}")
    print(f"   MediaPipe: {'✅' if MP_AVAILABLE else '❌'}")
    print(f"   Pillow: {'✅' if PIL_AVAILABLE else '❌'}")
    print(f"   Tesseract: {'✅' if TESSERACT_AVAILABLE else '❌'}")
    yield
    if face_detection:
        face_detection.close()
    print("👋 AI Service shutdown")


app = FastAPI(
    title="0711 AI Service",
    description="Face detection, embeddings, and image processing",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===========================================
# MODELS
# ===========================================

class Face(BaseModel):
    bbox_x: float
    bbox_y: float
    bbox_width: float
    bbox_height: float
    confidence: float
    embedding: Optional[List[float]] = None

class FaceDetectionResponse(BaseModel):
    faces: List[Face]
    image_width: int
    image_height: int
    processing_time_ms: float

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    model: str
    dimensions: int

class OCRResponse(BaseModel):
    text: str
    confidence: float
    language: str

class ImageAnalysisResponse(BaseModel):
    description: str
    objects: List[str]
    scene: str
    colors: List[str]
    text_detected: Optional[str] = None


# ===========================================
# HEALTH
# ===========================================

@app.get("/")
async def root():
    return {
        "service": "0711 AI Service",
        "version": "1.0.0",
        "capabilities": {
            "face_detection": MP_AVAILABLE and CV2_AVAILABLE,
            "embeddings": True,
            "ocr": TESSERACT_AVAILABLE,
            "image_analysis": True
        }
    }


@app.get("/health")
async def health():
    ollama_status = "unknown"
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{OLLAMA_HOST}/api/tags", timeout=5)
            ollama_status = "healthy" if r.status_code == 200 else "unhealthy"
    except:
        ollama_status = "unavailable"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "face_detection": "healthy" if (MP_AVAILABLE and CV2_AVAILABLE) else "unavailable",
            "ollama": ollama_status,
            "ocr": "healthy" if TESSERACT_AVAILABLE else "unavailable"
        }
    }


# ===========================================
# FACE DETECTION
# ===========================================

@app.post("/detect/faces", response_model=FaceDetectionResponse)
async def detect_faces(file: UploadFile = File(...)):
    """Detect faces in an image and return bounding boxes."""
    if not (MP_AVAILABLE and CV2_AVAILABLE):
        raise HTTPException(status_code=503, detail="Face detection not available")
    
    start_time = datetime.now()
    
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image")
    
    height, width = image.shape[:2]
    
    # Convert to RGB for MediaPipe
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Detect faces
    results = face_detection.process(rgb_image)
    
    faces = []
    if results.detections:
        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box
            faces.append(Face(
                bbox_x=max(0, bbox.xmin),
                bbox_y=max(0, bbox.ymin),
                bbox_width=min(1 - bbox.xmin, bbox.width),
                bbox_height=min(1 - bbox.ymin, bbox.height),
                confidence=detection.score[0]
            ))
    
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return FaceDetectionResponse(
        faces=faces,
        image_width=width,
        image_height=height,
        processing_time_ms=processing_time
    )


@app.post("/detect/faces/with-embeddings")
async def detect_faces_with_embeddings(file: UploadFile = File(...)):
    """Detect faces and generate embeddings for each face."""
    if not (MP_AVAILABLE and CV2_AVAILABLE):
        raise HTTPException(status_code=503, detail="Face detection not available")
    
    start_time = datetime.now()
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode image")
    
    height, width = image.shape[:2]
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    results = face_detection.process(rgb_image)
    
    faces = []
    if results.detections:
        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box
            
            # Extract face region
            x = int(max(0, bbox.xmin) * width)
            y = int(max(0, bbox.ymin) * height)
            w = int(min(bbox.width, 1 - bbox.xmin) * width)
            h = int(min(bbox.height, 1 - bbox.ymin) * height)
            
            face_crop = image[y:y+h, x:x+w]
            
            # Generate embedding using Ollama vision
            embedding = await generate_face_embedding(face_crop)
            
            faces.append({
                "bbox_x": max(0, bbox.xmin),
                "bbox_y": max(0, bbox.ymin),
                "bbox_width": min(1 - bbox.xmin, bbox.width),
                "bbox_height": min(1 - bbox.ymin, bbox.height),
                "confidence": detection.score[0],
                "embedding": embedding
            })
    
    processing_time = (datetime.now() - start_time).total_seconds() * 1000
    
    return {
        "faces": faces,
        "image_width": width,
        "image_height": height,
        "processing_time_ms": processing_time
    }


async def generate_face_embedding(face_image) -> List[float]:
    """Generate embedding for a face crop using Ollama."""
    # Encode face as base64
    _, buffer = cv2.imencode('.jpg', face_image)
    face_b64 = base64.b64encode(buffer).decode()
    
    # Use nomic-embed-text with a description of the face
    # (In production, you'd use a dedicated face embedding model)
    try:
        async with httpx.AsyncClient() as client:
            # First, describe the face
            r = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": "Describe this person's face briefly for identification: age range, distinctive features.",
                    "images": [face_b64],
                    "stream": False
                },
                timeout=60
            )
            if r.status_code == 200:
                description = r.json().get("response", "face")
            else:
                description = "face"
            
            # Then embed the description
            r = await client.post(
                f"{OLLAMA_HOST}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": description},
                timeout=30
            )
            if r.status_code == 200:
                return r.json().get("embedding", [])[:512]  # Truncate to 512 for face embeddings
    except Exception as e:
        print(f"Face embedding error: {e}")
    
    return [0.0] * 512  # Return zero vector on failure


# ===========================================
# IMAGE EMBEDDINGS
# ===========================================

@app.post("/embed/image", response_model=EmbeddingResponse)
async def embed_image(file: UploadFile = File(...)):
    """Generate CLIP-like embedding for an image."""
    contents = await file.read()
    
    # Encode as base64
    image_b64 = base64.b64encode(contents).decode()
    
    try:
        async with httpx.AsyncClient() as client:
            # Describe the image
            r = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": "Describe this image in detail: objects, people, scene, colors, mood, activities.",
                    "images": [image_b64],
                    "stream": False
                },
                timeout=60
            )
            
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail="Image description failed")
            
            description = r.json().get("response", "")
            
            # Embed the description
            r = await client.post(
                f"{OLLAMA_HOST}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": description},
                timeout=30
            )
            
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail="Embedding generation failed")
            
            embedding = r.json().get("embedding", [])
            
            return EmbeddingResponse(
                embedding=embedding,
                model=f"{VISION_MODEL}+{EMBEDDING_MODEL}",
                dimensions=len(embedding)
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama timeout")


@app.post("/embed/text", response_model=EmbeddingResponse)
async def embed_text(text: str = Form(...)):
    """Generate embedding for text."""
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OLLAMA_HOST}/api/embeddings",
                json={"model": EMBEDDING_MODEL, "prompt": text},
                timeout=30
            )
            
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail="Embedding failed")
            
            embedding = r.json().get("embedding", [])
            
            return EmbeddingResponse(
                embedding=embedding,
                model=EMBEDDING_MODEL,
                dimensions=len(embedding)
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama timeout")


# ===========================================
# IMAGE ANALYSIS
# ===========================================

@app.post("/analyze/image", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """Full analysis of an image: description, objects, scene, colors."""
    contents = await file.read()
    image_b64 = base64.b64encode(contents).decode()
    
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": """Analyze this image and respond in JSON format:
{
  "description": "detailed description",
  "objects": ["list", "of", "objects"],
  "scene": "type of scene (indoor/outdoor/nature/urban/etc)",
  "colors": ["dominant", "colors"],
  "text": "any text visible in image or null"
}""",
                    "images": [image_b64],
                    "stream": False,
                    "format": "json"
                },
                timeout=90
            )
            
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail="Analysis failed")
            
            response_text = r.json().get("response", "{}")
            try:
                analysis = json.loads(response_text)
            except:
                analysis = {
                    "description": response_text,
                    "objects": [],
                    "scene": "unknown",
                    "colors": []
                }
            
            return ImageAnalysisResponse(
                description=analysis.get("description", ""),
                objects=analysis.get("objects", []),
                scene=analysis.get("scene", "unknown"),
                colors=analysis.get("colors", []),
                text_detected=analysis.get("text")
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama timeout")


# ===========================================
# OCR
# ===========================================

@app.post("/ocr", response_model=OCRResponse)
async def extract_text(file: UploadFile = File(...), language: str = "eng"):
    """Extract text from image using OCR."""
    if not TESSERACT_AVAILABLE:
        # Fallback to Ollama vision
        contents = await file.read()
        image_b64 = base64.b64encode(contents).decode()
        
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{OLLAMA_HOST}/api/generate",
                    json={
                        "model": VISION_MODEL,
                        "prompt": "Extract and transcribe ALL text visible in this image. Return only the text, nothing else.",
                        "images": [image_b64],
                        "stream": False
                    },
                    timeout=60
                )
                
                if r.status_code == 200:
                    text = r.json().get("response", "")
                    return OCRResponse(text=text, confidence=0.7, language="detected")
        except:
            pass
        
        raise HTTPException(status_code=503, detail="OCR not available")
    
    # Use Tesseract
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    
    # Run OCR
    text = pytesseract.image_to_string(image, lang=language)
    
    # Get confidence
    data = pytesseract.image_to_data(image, lang=language, output_type=pytesseract.Output.DICT)
    confidences = [int(c) for c in data['conf'] if int(c) > 0]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    return OCRResponse(
        text=text.strip(),
        confidence=avg_confidence / 100,
        language=language
    )


# ===========================================
# DOCUMENT CATEGORIZATION
# ===========================================

@app.post("/categorize/document")
async def categorize_document(file: UploadFile = File(...)):
    """Categorize a document image."""
    contents = await file.read()
    image_b64 = base64.b64encode(contents).decode()
    
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": """Categorize this document. Respond in JSON:
{
  "category": "one of: invoice, receipt, contract, letter, medical, financial, legal, identity, certificate, other",
  "subcategory": "more specific type",
  "summary": "one sentence summary",
  "key_entities": {
    "dates": ["any dates found"],
    "amounts": ["any monetary amounts"],
    "names": ["any names or organizations"],
    "reference_numbers": ["any IDs or reference numbers"]
  },
  "language": "detected language"
}""",
                    "images": [image_b64],
                    "stream": False,
                    "format": "json"
                },
                timeout=90
            )
            
            if r.status_code != 200:
                raise HTTPException(status_code=500, detail="Categorization failed")
            
            response_text = r.json().get("response", "{}")
            try:
                result = json.loads(response_text)
            except:
                result = {"category": "other", "summary": response_text}
            
            return result
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama timeout")


# ===========================================
# BATCH PROCESSING
# ===========================================

@app.post("/process/full")
async def full_process(
    file: UploadFile = File(...),
    detect_faces: bool = True,
    generate_embedding: bool = True,
    analyze: bool = True,
    ocr: bool = False
):
    """Full processing pipeline for an image."""
    contents = await file.read()
    results = {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(contents)
    }
    
    # Face detection
    if detect_faces and MP_AVAILABLE and CV2_AVAILABLE:
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is not None:
            height, width = image.shape[:2]
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            face_results = face_detection.process(rgb_image)

            faces = []
            if face_results.detections:
                for detection in face_results.detections:
                    bbox = detection.location_data.relative_bounding_box

                    # Extract face region for embedding
                    x = int(max(0, bbox.xmin) * width)
                    y = int(max(0, bbox.ymin) * height)
                    w = int(min(bbox.width, 1 - bbox.xmin) * width)
                    h = int(min(bbox.height, 1 - bbox.ymin) * height)

                    face_data = {
                        "bbox_x": max(0, bbox.xmin),
                        "bbox_y": max(0, bbox.ymin),
                        "bbox_width": min(1 - bbox.xmin, bbox.width),
                        "bbox_height": min(1 - bbox.ymin, bbox.height),
                        "confidence": detection.score[0]
                    }

                    # Generate face embedding
                    if w > 20 and h > 20:  # Only embed faces of reasonable size
                        face_crop = image[y:y+h, x:x+w]
                        face_embedding = await generate_face_embedding(face_crop)
                        if face_embedding and len(face_embedding) > 0 and face_embedding[0] != 0.0:
                            face_data["embedding"] = face_embedding

                    faces.append(face_data)

            results["faces"] = faces
            results["image_dimensions"] = {"width": width, "height": height}
    
    image_b64 = base64.b64encode(contents).decode()
    
    # Image analysis and embedding
    if generate_embedding or analyze:
        try:
            async with httpx.AsyncClient() as client:
                # Get description
                r = await client.post(
                    f"{OLLAMA_HOST}/api/generate",
                    json={
                        "model": VISION_MODEL,
                        "prompt": "Describe this image in detail: objects, people, scene, colors, mood, activities, any text visible.",
                        "images": [image_b64],
                        "stream": False
                    },
                    timeout=90
                )
                
                if r.status_code == 200:
                    description = r.json().get("response", "")
                    if analyze:
                        results["description"] = description
                    
                    # Generate embedding from description
                    if generate_embedding:
                        r = await client.post(
                            f"{OLLAMA_HOST}/api/embeddings",
                            json={"model": EMBEDDING_MODEL, "prompt": description},
                            timeout=30
                        )
                        if r.status_code == 200:
                            results["embedding"] = r.json().get("embedding", [])
        except Exception as e:
            results["ai_error"] = str(e)
    
    # OCR
    if ocr:
        try:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{OLLAMA_HOST}/api/generate",
                    json={
                        "model": VISION_MODEL,
                        "prompt": "Extract ALL text visible in this image. Return only the text.",
                        "images": [image_b64],
                        "stream": False
                    },
                    timeout=60
                )
                if r.status_code == 200:
                    results["ocr_text"] = r.json().get("response", "")
        except:
            pass
    
    return results


# ===========================================
# FACE CLUSTERING
# ===========================================

@app.post("/cluster/faces/{user_id}")
async def cluster_user_faces(user_id: str):
    """Run DBSCAN clustering on all unclustered faces for a user."""
    import asyncpg
    from clustering import run_clustering_for_user
    
    try:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=3)
        result = await run_clustering_for_user(user_id, pool)
        await pool.close()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cluster/merge")
async def merge_face_clusters(
    cluster_ids: List[str],
    user_id: str,
    new_name: str = None
):
    """Merge multiple face clusters into one."""
    import asyncpg
    from clustering import merge_clusters
    
    try:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=3)
        result = await merge_clusters(cluster_ids, user_id, pool, new_name)
        await pool.close()
        return {"merged_cluster_id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/cluster/split")
async def split_face_cluster(
    cluster_id: str,
    face_ids: List[str],
    user_id: str,
    new_name: str = None
):
    """Split faces from a cluster into a new cluster."""
    import asyncpg
    from clustering import split_cluster
    
    try:
        pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=3)
        result = await split_cluster(cluster_id, face_ids, user_id, pool, new_name)
        await pool.close()
        return {"new_cluster_id": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
