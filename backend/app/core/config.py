from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PORT: int = 8000
    CORS_ORIGINS: List[str] = [
        "https://assign-f5p4.vercel.app",
        "https://pdfassign.onrender.com",
        "http://localhost:3000",  # Development only
        "http://localhost:8000",  # Development only
    ]
    
    # AI Configuration
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o"
    AI_PROVIDER: str = "openai"
    DEMO_MODE: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
