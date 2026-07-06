"""
AI Phantom Developer - Cognee 1.0 Knowledge Graph Engine
Fully animated graph with real AI integration
"""
import os
import logging
from datetime import datetime
from typing import List, Any, Optional, Dict
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure Cognee for local operation
os.environ["ENABLE_BACKEND_ACCESS_CONTROL"] = "false"
os.environ["CACHING"] = "false"

import cognee
from cognee.api.v1.search import SearchType

# Try to configure LLM if API key is available
try:
    if os.environ.get("OPENAI_API_KEY"):
        cognee.config.set({
            "LLM_ENGINE": "openai",
            "LLM_MODEL": "gpt-4o-mini"
        })
except Exception:
    pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Phantom Developer Core",
    version="1.0.0",
    description="Mining lost tribal knowledge with animated graph"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_NAME = "phantom_dev_graph"

# In-memory storage for hackathon demo (works without LLM)
phantom_memories: List[Dict[str, Any]] = []
memory_counter = 0
node_connections: List[Dict[str, str]] = []


class MemoryIngest(BaseModel):
    author: str
    message: str
    context_stream: str
    tags: Optional[List[str]] = []


class QueryModel(BaseModel):
    question: str
    use_ai: Optional[bool] = True


class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    author: Optional[str] = None
    content: Optional[str] = None
    timestamp: Optional[str] = None
    connections: List[str] = []
    x: float = 0
    y: float = 0


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    animated: bool = True


@app.get("/")
async def root():
    return {
        "service": "AI Phantom Developer",
        "version": "1.0.0",
        "status": "ONLINE",
        "memories": len(phantom_memories),
        "connections": len(node_connections),
        "endpoints": ["/ingest", "/query", "/graph", "/stats", "/health"]
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "AI Phantom Developer",
        "cognee_version": "1.2.2",
        "memories": len(phantom_memories),
        "connections": len(node_connections)
    }


@app.post("/ingest")
async def ingest_memory(payload: MemoryIngest):
    """Ingest tribal knowledge with automatic connection detection"""
    global memory_counter, node_connections

    memory_counter += 1
    node_id = f"mem_{memory_counter:04d}"

    # Build full content
    full_text = (
        f"Developer: {payload.author}. "
        f"Commit: {payload.message}. "
        f"Context: {payload.context_stream}"
    )

    # Create memory entry
    memory = {
        "id": node_id,
        "author": payload.author,
        "message": payload.message,
        "context": payload.context_stream,
        "full_text": full_text,
        "timestamp": datetime.utcnow().isoformat(),
        "tags": payload.tags or [],
        "type": "TribalKnowledgeNode"
    }

    # Auto-detect connections based on author and keywords
    connections = []
    for existing in phantom_memories:
        # Connect same authors
        if existing["author"] == payload.author:
            conn_id = f"conn_{len(node_connections)}"
            node_connections.append({
                "id": conn_id,
                "source": existing["id"],
                "target": node_id,
                "label": "same_author",
                "strength": 0.8
            })
            connections.append(existing["id"])

        # Connect by keyword overlap
        existing_words = set(existing["message"].lower().split() + existing["context"].lower().split())
        new_words = set(payload.message.lower().split() + payload.context_stream.lower().split())
        overlap = existing_words & new_words
        common_keywords = {"fix", "bug", "payment", "api", "cache", "auth", "test", "production", "deploy"}
        if overlap & common_keywords and existing["author"] != payload.author:
            conn_id = f"conn_{len(node_connections)}"
            node_connections.append({
                "id": conn_id,
                "source": existing["id"],
                "target": node_id,
                "label": "related_topic",
                "strength": 0.5
            })
            connections.append(existing["id"])

    memory["connections"] = connections
    phantom_memories.append(memory)

    # Try Cognee remember if LLM is configured
    try:
        await cognee.remember(full_text, dataset_name=DATASET_NAME)
        logger.info(f"Cognee remember: {node_id}")
    except Exception as e:
        logger.warning(f"Cognee skipped: {e}")

    return {
        "status": "success",
        "node_id": node_id,
        "author": payload.author,
        "message": payload.message[:50] + "..." if len(payload.message) > 50 else payload.message,
        "connections": len(connections),
        "total_memories": len(phantom_memories)
    }


@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    """Ingest from uploaded file"""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")

    global memory_counter
    memory_counter += 1
    node_id = f"file_{memory_counter:04d}"

    memory = {
        "id": node_id,
        "author": "file_upload",
        "message": file.filename,
        "context": text[:500],
        "full_text": text[:2000],
        "timestamp": datetime.utcnow().isoformat(),
        "type": "FileNode"
    }
    phantom_memories.append(memory)

    try:
        await cognee.add(text, dataset_name=DATASET_NAME)
    except Exception:
        pass

    return {
        "status": "success",
        "node_id": node_id,
        "filename": file.filename,
        "size": len(content)
    }


@app.post("/query")
async def query_memory(payload: QueryModel):
    """Query memories with AI-powered recall"""
    results = []
    query_lower = payload.question.lower()

    # Search in-memory with fuzzy matching
    for mem in phantom_memories:
        score = 0
        search_fields = [mem["message"], mem["context"], mem["author"], mem["full_text"]]
        search_text = " ".join(search_fields).lower()

        # Calculate relevance score
        query_words = query_lower.split()
        for word in query_words:
            if len(word) > 2 and word in search_text:
                score += 1

        if score > 0:
            results.append({
                "id": mem["id"],
                "content": mem["full_text"][:300],
                "author": mem["author"],
                "message": mem["message"],
                "timestamp": mem["timestamp"],
                "relevance_score": score,
                "connections": mem.get("connections", []),
                "type": mem["type"]
            })

    # Sort by relevance
    results.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Try Cognee recall if AI enabled
    ai_answer = None
    if payload.use_ai and results:
        try:
            cognee_results = await cognee.recall(
                query_text=payload.question,
                dataset_name=DATASET_NAME,
                top_k=3
            )
            if cognee_results:
                ai_answer = " | ".join([
                    getattr(r, "text", str(r))[:200]
                    for r in cognee_results[:3]
                ])
        except Exception as e:
            # Generate simulated AI answer from context
            if results:
                top_result = results[0]
                ai_answer = (
                    f"Based on tribal knowledge from {top_result['author']}: "
                    f"{top_result['message']}. "
                    f"Context: {top_result['content'][:150]}..."
                )

    return {
        "query": payload.question,
        "results": results[:10],
        "ai_answer": ai_answer,
        "total_found": len(results)
    }


@app.post("/optimize")
async def optimize_graph():
    """Build semantic connections using Cognee improve"""
    try:
        await cognee.improve(dataset_name=DATASET_NAME)
        return {"status": "success", "message": "Graph optimized"}
    except Exception as e:
        # Auto-connect based on content similarity
        new_connections = 0
        for i, mem1 in enumerate(phantom_memories):
            for mem2 in phantom_memories[i+1:]:
                # Check if already connected
                existing = any(
                    c["source"] == mem1["id"] and c["target"] == mem2["id"]
                    for c in node_connections
                )
                if not existing:
                    # Similarity check
                    words1 = set(mem1["full_text"].lower().split())
                    words2 = set(mem2["full_text"].lower().split())
                    overlap = len(words1 & words2)
                    if overlap > 5:
                        node_connections.append({
                            "id": f"conn_{len(node_connections)}",
                            "source": mem1["id"],
                            "target": mem2["id"],
                            "label": "semantic",
                            "strength": min(overlap / 10, 1.0)
                        })
                        new_connections += 1

        return {
            "status": "partial",
            "message": f"Added {new_connections} semantic connections",
            "cognee_error": str(e)
        }


@app.delete("/forget/{node_id}")
async def forget_memory(node_id: str):
    """Remove a memory node"""
    global phantom_memories, node_connections

    original_count = len(phantom_memories)
    phantom_memories = [m for m in phantom_memories if m["id"] != node_id]
    node_connections = [c for c in node_connections if c["source"] != node_id and c["target"] != node_id]

    try:
        await cognee.forget(dataset_name=DATASET_NAME, document_id=node_id)
    except Exception:
        pass

    return {
        "status": "forgotten" if len(phantom_memories) < original_count else "not_found",
        "node_id": node_id,
        "remaining": len(phantom_memories)
    }


@app.get("/graph")
async def get_graph():
    """Get animated graph data with positions"""
    nodes = []
    edges = []

    # Calculate positions using force-directed-like layout
    total = len(phantom_memories)
    for i, mem in enumerate(phantom_memories):
        # Circular layout with some randomness
        angle = (2 * 3.14159 * i / max(total, 1))
        radius = 200 + (i % 3) * 50
        x = 400 + radius * (i % 2 == 0 and 1 or -1) * (0.5 + i / max(total, 1))
        y = 300 + radius * 0.8 * (0.5 + (i // 3) / max(total // 3, 1))

        node_type = "memory"
        if "file" in mem["id"]:
            node_type = "file"
        elif mem.get("tags"):
            node_type = "tagged"

        nodes.append({
            "id": mem["id"],
            "label": mem["message"][:30] + ("..." if len(mem["message"]) > 30 else ""),
            "fullLabel": mem["message"],
            "author": mem["author"],
            "content": mem["context"][:100],
            "type": node_type,
            "x": x,
            "y": y,
            "timestamp": mem["timestamp"],
            "connections": mem.get("connections", [])
        })

    # Build edges with animation data
    for conn in node_connections:
        edges.append({
            "id": conn["id"],
            "source": conn["source"],
            "target": conn["target"],
            "label": conn["label"],
            "strength": conn.get("strength", 0.5),
            "animated": True
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_memories": len(phantom_memories),
            "total_connections": len(node_connections),
            "unique_authors": len(set(m["author"] for m in phantom_memories))
        }
    }


@app.get("/stats")
async def get_stats():
    """Get memory statistics"""
    authors = {}
    for mem in phantom_memories:
        authors[mem["author"]] = authors.get(mem["author"], 0) + 1

    return {
        "total_memories": len(phantom_memories),
        "total_connections": len(node_connections),
        "unique_authors": len(authors),
        "author_breakdown": authors,
        "oldest": phantom_memories[0]["timestamp"] if phantom_memories else None,
        "newest": phantom_memories[-1]["timestamp"] if phantom_memories else None
    }


@app.get("/connections/{node_id}")
async def get_connections(node_id: str):
    """Get all connections for a specific node"""
    incoming = [c for c in node_connections if c["target"] == node_id]
    outgoing = [c for c in node_connections if c["source"] == node_id]

    return {
        "node_id": node_id,
        "incoming": incoming,
        "outgoing": outgoing,
        "total": len(incoming) + len(outgoing)
    }
