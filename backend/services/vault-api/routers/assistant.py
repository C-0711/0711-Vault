"""
Personal AI Assistant - The brain of 0711-Vault
Answers questions about YOUR photos, documents, and memories.
Runs locally. No cloud. No Big Tech. Just you.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import text
import json
import asyncio
import httpx

from config import settings
from database import get_db, get_neo4j, get_ollama, get_redis
from auth import get_current_user

router = APIRouter()


# ===========================================
# SCHEMAS
# ===========================================

class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None  # For multi-turn conversations
    include_context: bool = True  # Whether to search vault for context


class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    sources: List[Dict[str, Any]]  # Referenced photos/docs
    thinking: Optional[str] = None  # Show reasoning if enabled


class MemoryRequest(BaseModel):
    """Request for 'On This Day' and similar memory features"""
    memory_type: str  # on_this_day, highlights, people_summary
    date: Optional[datetime] = None


class MemoryResponse(BaseModel):
    memories: List[Dict[str, Any]]
    message: str


# ===========================================
# CONTEXT BUILDER - The RAG Engine
# ===========================================

async def build_context(query: str, user_id: str, db, neo4j) -> Dict[str, Any]:
    """
    Build rich context from the user's vault for answering questions.
    Combines:
    - Semantic search (vector similarity)
    - Graph traversal (relationships)
    - Temporal context (dates, events)
    """
    context = {
        "photos": [],
        "documents": [],
        "people": [],
        "places": [],
        "events": [],
        "timeline": []
    }
    
    ollama = get_ollama()
    
    # 1. Generate query embedding
    if not ollama:
        print(f"ERROR: Ollama client is None! init_db() may not have been called.")
        return context
    
    try:
        embedding_response = await ollama.embeddings(
            model=settings.EMBEDDING_MODEL,
            prompt=query
        )
        query_embedding = embedding_response['embedding']
        print(f"DEBUG: Generated query embedding with {len(query_embedding)} dimensions")
    except Exception as e:
        print(f"Embedding error: {e}")
        import traceback
        traceback.print_exc()
        return context
    
    # 2. Semantic search for relevant items
    try:
        result = await db.execute(text("""
            SELECT 
                vi.id,
                vi.item_type,
                vi.encrypted_metadata,
                vi.captured_at,
                vi.storage_key,
                1 - (e.embedding <=> :query_embedding::vector) as score
            FROM embeddings e
            JOIN vault_items vi ON e.item_id = vi.id
            WHERE vi.user_id = :user_id 
              AND vi.deleted_at IS NULL
            ORDER BY e.embedding <=> :query_embedding::vector
            LIMIT 10
        """), {
            "query_embedding": str(query_embedding),
            "user_id": user_id
        })
        
        items = result.fetchall()
        for item in items:
            if item.item_type == 'photo':
                context["photos"].append({
                    "id": str(item.id),
                    "captured_at": item.captured_at.isoformat() if item.captured_at else None,
                    "score": item.score,
                    "path": item.storage_key
                })
            elif item.item_type == 'document':
                context["documents"].append({
                    "id": str(item.id),
                    "score": item.score,
                    "path": item.storage_key
                })
        print(f"DEBUG: Semantic search found {len(items)} items")
    except Exception as e:
        print(f"Semantic search error: {e}")
        import traceback
        traceback.print_exc()
    
    # 3. Graph search for people and relationships
    if neo4j:
        try:
            async with neo4j.session() as session:
                # Find people mentioned or relevant
                result = await session.run("""
                    MATCH (p:Person)-[:APPEARS_IN]->(i:VaultItem)
                    WHERE i.user_id = $user_id
                    WITH p, count(i) as appearances
                    RETURN p.id as id, p.name as name, appearances
                    ORDER BY appearances DESC
                    LIMIT 20
                """, user_id=user_id)
                
                people = await result.data()
                context["people"] = people
                
                # Find places
                result = await session.run("""
                    MATCH (l:Location)<-[:TAKEN_AT]-(i:VaultItem)
                    WHERE i.user_id = $user_id
                    WITH l, count(i) as photo_count
                    RETURN l.id as id, l.name as name, l.coordinates as coords, photo_count
                    ORDER BY photo_count DESC
                    LIMIT 10
                """, user_id=user_id)
                
                places = await result.data()
                context["places"] = places
                
        except Exception as e:
            print(f"Graph search error: {e}")
    
    return context


async def classify_intent(query: str, ollama) -> Dict[str, Any]:
    """
    Classify what the user is asking for.
    Returns intent type and extracted entities.
    """
    prompt = f"""Analyze this query about a personal photo/document vault.
Return JSON with:
- intent: one of [search_photos, search_documents, find_person, find_place, timeline_query, memory_question, general_question]
- entities: extracted names, dates, locations, etc.
- time_range: if temporal, extract start/end dates

Query: "{query}"

JSON response:"""
    
    try:
        response = await ollama.generate(
            model=settings.VISION_MODEL,  # Use the smart model
            prompt=prompt,
            format="json",
            stream=False
        )
        return json.loads(response['response'])
    except:
        return {"intent": "general_question", "entities": {}}


# ===========================================
# MAIN CHAT ENDPOINT
# ===========================================

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Chat with your vault's AI assistant.
    
    Ask questions like:
    - "When did I last see Mom?"
    - "Show me photos from my trip to Berlin"
    - "Find my insurance documents"
    - "Who was at the Christmas party last year?"
    - "What restaurants have I been to?"
    """
    
    ollama = get_ollama()
    neo4j = get_neo4j()
    redis = get_redis()
    
    # Get or create conversation
    conversation_id = request.conversation_id or f"conv_{user_id}_{datetime.utcnow().timestamp()}"
    
    # Load conversation history from Redis
    history = []
    if redis and request.conversation_id:
        cached = await redis.get(f"conversation:{conversation_id}")
        if cached:
            history = json.loads(cached)
    
    # Build context from vault if enabled
    sources = []
    vault_context = ""
    
    if request.include_context:
        context = await build_context(request.message, user_id, db, neo4j)
        
        # Format context for the LLM
        if context["photos"]:
            vault_context += f"\n\nRelevant photos found: {len(context['photos'])}"
            for p in context["photos"][:5]:
                vault_context += f"\n- Photo from {p['captured_at'] or 'unknown date'} (relevance: {p['score']:.2f})"
                sources.append({"type": "photo", "id": p["id"], "date": p["captured_at"]})
        
        if context["documents"]:
            vault_context += f"\n\nRelevant documents found: {len(context['documents'])}"
            for d in context["documents"][:3]:
                sources.append({"type": "document", "id": d["id"]})
        
        if context["people"]:
            vault_context += f"\n\nPeople in your vault: {', '.join([p['name'] for p in context['people'][:10] if p['name']])}"
        
        if context["places"]:
            vault_context += f"\n\nPlaces you've been: {', '.join([p['name'] for p in context['places'][:10] if p['name']])}"
    
    # Build the prompt
    system_prompt = """You are a personal AI assistant living inside the user's private photo and document vault.
You have access to their photos, documents, and memories. Your job is to help them find and remember things.

IMPORTANT RULES:
1. Only reference information from the provided context - never make up data
2. If you don't have enough information, say so honestly
3. Be warm and personal - these are their memories
4. Suggest related things they might want to see
5. If asked about something not in the vault, acknowledge it

You are running 100% locally - their data never leaves their device. You are THEIR assistant, not a cloud service."""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Add conversation history
    for msg in history[-10:]:  # Last 10 messages for context
        messages.append(msg)
    
    # Add current message with context
    user_message = request.message
    if vault_context:
        user_message += f"\n\n[VAULT CONTEXT]{vault_context}\n[/VAULT CONTEXT]"
    
    messages.append({"role": "user", "content": user_message})
    
    # Generate response
    try:
        response = await ollama.chat(
            model=settings.VISION_MODEL,
            messages=messages,
            stream=False
        )
        assistant_response = response['message']['content']
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
    
    # Save to conversation history
    history.append({"role": "user", "content": request.message})
    history.append({"role": "assistant", "content": assistant_response})
    
    if redis:
        await redis.setex(
            f"conversation:{conversation_id}",
            3600 * 24,  # 24 hour TTL
            json.dumps(history)
        )
    
    return ChatResponse(
        response=assistant_response,
        conversation_id=conversation_id,
        sources=sources
    )


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Streaming chat endpoint for real-time responses.
    Returns Server-Sent Events (SSE).
    """
    
    ollama = get_ollama()
    neo4j = get_neo4j()
    
    # Build context
    context = await build_context(request.message, user_id, db, neo4j) if request.include_context else {}
    
    # Format context
    vault_context = ""
    if context.get("photos"):
        vault_context += f"\nFound {len(context['photos'])} relevant photos."
    if context.get("people"):
        vault_context += f"\nPeople: {', '.join([p['name'] for p in context['people'][:5] if p.get('name')])}"
    
    system_prompt = """You are a personal AI assistant for a private photo/document vault.
Help the user find and remember things from their vault. Only reference provided context.
Be warm, helpful, and honest when you don't have information."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": request.message + (f"\n\n[Context]{vault_context}[/Context]" if vault_context else "")}
    ]
    
    async def generate():
        try:
            async for chunk in await ollama.chat(
                model=settings.VISION_MODEL,
                messages=messages,
                stream=True
            ):
                if chunk.get('message', {}).get('content'):
                    yield f"data: {json.dumps({'content': chunk['message']['content']})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# ===========================================
# MEMORY FEATURES - Proactive Intelligence
# ===========================================

@router.get("/memories/on-this-day")
async def on_this_day(user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Get photos from this day in previous years.
    The "On This Day" feature that makes people smile.
    """
    
    today = datetime.utcnow()
    memories = []
    
    # Search for photos from this day in past years
    for years_ago in range(1, 11):  # Up to 10 years back
        target_date = today - timedelta(days=365 * years_ago)
        start = target_date.replace(hour=0, minute=0, second=0)
        end = target_date.replace(hour=23, minute=59, second=59)
        
        result = await db.execute(text("""
            SELECT id, storage_key, captured_at, encrypted_metadata
            FROM vault_items
            WHERE user_id = :user_id
              AND item_type = 'photo'
              AND captured_at BETWEEN :start AND :end
              AND deleted_at IS NULL
            ORDER BY captured_at
            LIMIT 10
        """), {
            "user_id": user_id,
            "start": start,
            "end": end
        })
        
        photos = result.fetchall()
        if photos:
            memories.append({
                "year": target_date.year,
                "years_ago": years_ago,
                "photos": [
                    {
                        "id": str(p.id),
                        "path": p.storage_key,
                        "captured_at": p.captured_at.isoformat()
                    }
                    for p in photos
                ]
            })
    
    message = f"Found memories from {len(memories)} previous years!" if memories else "No memories from this day yet. Keep capturing moments!"
    
    return MemoryResponse(memories=memories, message=message)


@router.get("/memories/highlights")
async def weekly_highlights(user_id: str = Depends(get_current_user), days: int = 7, db=Depends(get_db)):
    """
    Get photo highlights from the past week.
    Uses AI to select the best/most interesting photos.
    """
    
    # Get recent photos
    since = datetime.utcnow() - timedelta(days=days)
    
    result = await db.execute(text("""
        SELECT id, storage_key, captured_at, encrypted_metadata
        FROM vault_items
        WHERE user_id = :user_id
          AND item_type = 'photo'
          AND created_at >= :since
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 50
    """), {
        "user_id": user_id,
        "since": since
    })
    
    photos = result.fetchall()
    
    # TODO: Use AI to rank/select best photos based on:
    # - Face detection (photos with people)
    # - Scene variety
    # - Quality scores
    # For now, just return recent ones
    
    return {
        "period": f"Last {days} days",
        "total_photos": len(photos),
        "highlights": [
            {
                "id": str(p.id),
                "path": p.storage_key,
                "captured_at": p.captured_at.isoformat() if p.captured_at else None
            }
            for p in photos[:10]
        ]
    }


@router.get("/memories/people/{person_id}")
async def person_memories(person_id: str, user_id: str = Depends(get_current_user), db=Depends(get_db)):
    """
    Get all memories featuring a specific person.
    Timeline of photos with this person.
    """
    
    neo4j = get_neo4j()
    if not neo4j:
        raise HTTPException(status_code=503, detail="Graph database not available")
    
    async with neo4j.session() as session:
        # Get person info
        result = await session.run("""
            MATCH (p:Person {id: $person_id})
            RETURN p.name as name, p.first_seen as first_seen, p.last_seen as last_seen
        """, person_id=person_id)
        
        person = await result.single()
        if not person:
            raise HTTPException(status_code=404, detail="Person not found")
        
        # Get photos with this person
        result = await session.run("""
            MATCH (p:Person {id: $person_id})-[:APPEARS_IN]->(i:VaultItem)
            WHERE i.user_id = $user_id
            RETURN i.id as id, i.captured_at as date, i.storage_key as path
            ORDER BY i.captured_at DESC
            LIMIT 100
        """, person_id=person_id, user_id=user_id)
        
        photos = await result.data()
    
    return {
        "person": {
            "id": person_id,
            "name": person["name"],
            "first_seen": person["first_seen"],
            "last_seen": person["last_seen"]
        },
        "photo_count": len(photos),
        "photos": photos
    }


# ===========================================
# SMART ALBUMS - AI-Generated Collections
# ===========================================

@router.post("/albums/generate")
async def generate_smart_album(
    album_type: str,  # trip, event, best_of_year, person_highlights
    params: Dict[str, Any] = {},
    user_id: str = Depends(get_current_user),
    db=Depends(get_db)
):
    """
    Generate a smart album using AI.
    
    Album types:
    - trip: Photos from a detected trip/travel
    - event: Photos from a detected event (party, wedding, etc.)
    - best_of_year: Best photos from a year
    - person_highlights: Best photos featuring a person
    """
    
    # TODO: Implement smart album generation
    # This would:
    # 1. Cluster photos by time/location for trips
    # 2. Use face detection for people albums
    # 3. Use image quality/interestingness scores for "best of"
    
    return {
        "status": "coming_soon",
        "message": "Smart album generation is being built!"
    }
