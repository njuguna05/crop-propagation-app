from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Crop Propagation API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "FastAPI backend for crop propagation management system"

    # CORS Configuration
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3300,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3300"

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from string"""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/crop_propagation_db"
    DATABASE_ECHO: bool = False  # Set to True for SQL query logging

    # JWT Configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Pagination
    DEFAULT_PAGE_SIZE: int = 100
    MAX_PAGE_SIZE: int = 1000

    # File Upload (for future features)
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_FOLDER: str = "uploads"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


# Global settings instance
settings = Settings()