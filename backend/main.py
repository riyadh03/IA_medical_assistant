from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import router as consultation_router
from app.database import init_db

app = FastAPI(
    title="IA Medical Assistant",
    description="API FastAPI pour un workflow multi-agents médical académique avec LangGraph et MCP.",
    version="0.1.0",
)

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite database schema
@app.on_event("startup")
def startup_event():
    init_db()

# Register consultation endpoints router
app.include_router(consultation_router)

@app.get("/")
def read_root():
    return {"status": "active", "service": "IA Medical Assistant API", "version": "0.1.0"}
