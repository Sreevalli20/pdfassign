from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import assessment, health
from app.core.config import settings
import os

app = FastAPI(
    title="VedaAI Assessment API",
    description="API for processing question papers and handwritten answer sheets",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(assessment.router, prefix="/api/assessment", tags=["assessment"])

# Create temp directory for uploads
os.makedirs("temp", exist_ok=True)
os.makedirs("temp/uploads", exist_ok=True)
os.makedirs("temp/processed", exist_ok=True)

@app.get("/")
async def root():
    return {"message": "VedaAI Assessment API", "version": "1.0.0"}
