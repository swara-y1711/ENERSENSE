import os
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load .env file from backend directory
load_dotenv()


class Settings(BaseModel):
    PROJECT_NAME: str = "ENERSENSE Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Supabase credentials (read from environment)
    SUPABASE_URL: str = Field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    SUPABASE_KEY: str = Field(default_factory=lambda: os.getenv("SUPABASE_KEY", ""))

    # Frontend URL for CORS
    FRONTEND_URL: str = Field(
        default_factory=lambda: os.getenv("FRONTEND_URL", "http://localhost:3000")
    )

    # Allowed CORS origins
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/"),
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )


settings = Settings()
