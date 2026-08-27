from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # AI Configuration
    AI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4o"
    AI_PROVIDER: str = "openai"
    DEMO_MODE: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
