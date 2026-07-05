"""
LifeOS AI Backend - Cognee-powered memory graph
"""
import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic_settings import BaseSettings
import jwt

# Disable Cognee's multi-user auth for simple hackathon demo
os.environ["ENABLE_BACKEND_ACCESS_CONTROL"] = "false"
os.environ["CACHING"] = "false"  # Disable session caching for simpler graph access

import cognee
from cognee.api.v1.search import SearchType
from cognee.infrastructure.databases.graph import get_graph_config


class Settings(BaseSettings):
    jwt_secret: str = "lifeos-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    cognee_graph_db: str = "networkx"
    cognee_embedding_engine: str = "ollama"

    class Config:
        env_file = ".env"


settings = Settings()

app = FastAPI(title="LifeOS AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cognee uses default local config (networkx graph, lanceDB vector)

# Dataset name for our memories
DATASET_NAME = "lifeos_memories"

# Simple in-memory user store (for hackathon)
users_db: dict = {}

# In-memory storage for extension captures (for demo without LLM)
extension_memories: List[Dict[str, Any]] = []


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str = ""


class UserLogin(BaseModel):
    email: str
    password: str


class IngestText(BaseModel):
    text: str


class ExtensionCapture(BaseModel):
    text: str
    source: str = "chrome_extension"
    url: Optional[str] = None
    title: Optional[str] = None
    timestamp: Optional[str] = None


class AskQuery(BaseModel):
    query: str


def create_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(hours=settings.jwt_expire_hours)
    return jwt.encode(
        {"sub": email, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )


def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        return payload["sub"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.JWTError:
        raise HTTPException(401, "Invalid token")


def get_current_user(authorization: str = "") -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    token = authorization[7:]
    return verify_token(token)


@app.post("/auth/signup")
async def signup(user: UserCreate):
    if user.email in users_db:
        raise HTTPException(400, "Email already registered")

    users_db[user.email] = {
        "email": user.email,
        "password": user.password,
        "full_name": user.full_name,
    }

    token = create_token(user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user.email, "full_name": user.full_name}
    }


@app.post("/auth/login")
async def login(user: UserLogin):
    if user.email not in users_db or users_db[user.email]["password"] != user.password:
        raise HTTPException(401, "Invalid credentials")

    token = create_token(user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"email": user.email, "full_name": users_db[user.email]["full_name"]}
    }


@app.post("/ingest/text")
async def ingest_text(data: IngestText):
    """Ingest text into Cognee knowledge graph"""
    try:
        # Add text to Cognee dataset
        await cognee.add(data.text, dataset_name=DATASET_NAME)

        # Cognify to build the knowledge graph
        await cognee.cognify(datasets=[DATASET_NAME])

        return {"status": "success", "message": "Text ingested and graph built"}
    except Exception as e:
        raise HTTPException(500, f"Ingestion failed: {str(e)}")


@app.post("/ingest/extension")
async def ingest_extension(data: ExtensionCapture):
    """Ingest browsing data from Chrome extension"""
    try:
        # Format the content with metadata
        formatted_text = data.text
        if data.title:
            formatted_text = f"[{data.title}]\n{formatted_text}"
        if data.url:
            formatted_text = f"URL: {data.url}\n{formatted_text}"

        # Store in memory (simple in-memory storage for hackathon demo)
        memory_entry = {
            "text": formatted_text,
            "source": data.source,
            "url": data.url,
            "title": data.title,
            "timestamp": data.timestamp or datetime.utcnow().isoformat()
        }
        extension_memories.append(memory_entry)

        # Try to add to Cognee if available (requires LLM API key)
        try:
            await cognee.add(formatted_text, dataset_name=DATASET_NAME)
        except Exception:
            pass  # Still return success if Cognee fails

        return {
            "status": "success",
            "message": "Browsing data captured",
            "title": data.title,
            "url": data.url
        }
    except Exception as e:
        raise HTTPException(500, f"Extension capture failed: {str(e)}")


@app.get("/memories/extension")
async def get_extension_memories():
    """Get memories captured from the Chrome extension"""
    return {
        "memories": extension_memories,
        "count": len(extension_memories)
    }


@app.post("/ingest/file")
async def ingest_file(file: UploadFile = File(...)):
    """Ingest uploaded file into Cognee knowledge graph"""
    try:
        content = await file.read()
        text = content.decode("utf-8", errors="ignore")

        await cognee.add(text, dataset_name=DATASET_NAME)
        await cognee.cognify(datasets=[DATASET_NAME])

        return {"status": "success", "message": f"File '{file.filename}' ingested"}
    except Exception as e:
        raise HTTPException(500, f"File ingestion failed: {str(e)}")


@app.get("/graph")
async def get_graph():
    """Get the knowledge graph in React Flow format"""
    try:
        # Get the graph engine directly
        graph_config = get_graph_config()
        graph_engine = graph_config.graph_engine

        # Get all graph data
        graph_data = await graph_engine.get_graph_data()

        if not graph_data:
            return {"nodes": [], "edges": []}

        nodes = []
        edges = []

        # Convert nodes
        for node in graph_data.get("nodes", []):
            node_id = str(node.get("id", node.get("name", "")))
            nodes.append({
                "id": node_id,
                "type": "memory",
                "data": {
                    "label": node.get("name", node_id[:20]),
                    "type": node.get("type", "entity"),
                    "description": str(node.get("description", ""))[:100]
                },
                "position": {"x": 0, "y": 0}
            })

        # Convert edges
        for edge in graph_data.get("edges", []):
            source = str(edge.get("source", edge.get("from", "")))
            target = str(edge.get("target", edge.get("to", "")))
            edges.append({
                "id": f"{source}-{target}",
                "source": source,
                "target": target,
                "label": edge.get("relationship", edge.get("label", "")),
                "type": "default"
            })

        return {"nodes": nodes, "edges": edges}

    except Exception as e:
        # Fallback: try getting graph via search
        try:
            # Use search to find nodes
            results = await cognee.search(
                query_text="*",
                query_type=SearchType.CHUNKS,
                datasets=[DATASET_NAME],
                top_k=100
            )

            nodes = []
            edges = []
            seen_ids = set()

            for r in results:
                node_id = str(getattr(r, "id", str(hash(r))))
                if node_id not in seen_ids:
                    seen_ids.add(node_id)
                    nodes.append({
                        "id": node_id,
                        "type": "memory",
                        "data": {
                            "label": str(getattr(r, "name", str(r)[:30])),
                            "type": "chunk",
                            "description": str(getattr(r, "text", str(r)[:100]))
                        },
                        "position": {"x": 0, "y": 0}
                    })

            return {"nodes": nodes, "edges": edges}
        except Exception as e2:
            return {"nodes": [], "edges": [], "error": str(e2)}


@app.post("/ask")
async def ask(query: AskQuery):
    """Ask a question using Cognee search and recall"""
    try:
        # Use Cognee's recall for intelligent answers with context
        results = await cognee.recall(
            query_text=query.query,
            datasets=[DATASET_NAME],
            top_k=10,
            include_references=True
        )

        answer = ""
        retrieved_nodes = []

        if results:
            for r in results:
                # Handle different response types
                if hasattr(r, "answer"):
                    answer += r.answer + "\n"
                elif hasattr(r, "content"):
                    answer += r.content + "\n"
                elif hasattr(r, "text"):
                    answer += r.text + "\n"
                elif isinstance(r, str):
                    answer += r + "\n"

                # Extract referenced nodes
                if hasattr(r, "references"):
                    for ref in r.references:
                        retrieved_nodes.append({
                            "id": str(getattr(ref, "id", "")),
                            "label": str(getattr(ref, "name", str(ref)[:20]))
                        })

        if not answer:
            answer = "I couldn't find relevant information in your memory."

        return {
            "answer": answer,
            "retrieved_nodes": retrieved_nodes[:5],
            "query": query.query
        }

    except Exception as e:
        # Fallback to simple search
        try:
            results = await cognee.search(
                query_text=query.query,
                query_type=SearchType.GRAPH_COMPLETION,
                datasets=[DATASET_NAME],
                top_k=5
            )

            answer = ""
            retrieved_nodes = []

            for r in results:
                if hasattr(r, "answer"):
                    answer += r.answer + "\n"
                elif hasattr(r, "content"):
                    answer += r.content + "\n"
                elif isinstance(r, str):
                    answer += r + "\n"

            if not answer:
                answer = "No relevant memories found."

            return {
                "answer": answer,
                "retrieved_nodes": retrieved_nodes,
                "query": query.query
            }
        except Exception as e2:
            return {
                "answer": f"Unable to search memory. Error: {str(e2)}",
                "retrieved_nodes": [],
                "query": query.query
            }


@app.post("/remember")
async def remember_text(data: IngestText):
    """Use Cognee's remember API (add + cognify in one call)"""
    try:
        result = await cognee.remember(data.text, dataset_name=DATASET_NAME)
        return {
            "status": "success",
            "message": "Memory stored and graph built",
            "dataset": result.dataset_name if hasattr(result, "dataset_name") else DATASET_NAME
        }
    except Exception as e:
        raise HTTPException(500, f"Memory storage failed: {str(e)}")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "LifeOS AI Backend", "cognee_version": cognee.get_cognee_version()}
