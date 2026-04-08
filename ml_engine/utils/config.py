
"""Configuration management using Pydantic Settings."""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings."""
    
    # Server Configuration
    ml_engine_host: str = "0.0.0.0"
    ml_engine_port: int = 8001
    ml_engine_env: str = "development"
    
    # Database Configuration
    database_url: str = "postgresql://user:password@localhost:5432/hvhc_bigdata"
    
    # MinIO Configuration
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket_name: str = "hvhc-ml-models"
    minio_use_ssl: bool = False
    
    # Model Storage
    model_storage_path: str = "./models"
    temp_data_path: str = "./data/temp"
    
    # ML Configuration
    max_training_time: int = 3600
    default_test_size: float = 0.2
    default_random_state: int = 42
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "./logs/ml_engine.log"
    
    # CORS Configuration
    allowed_origins: str = "http://localhost:3000,http://localhost:8001"
    
    # API Keys
    api_key_secret: str = "your_secret_key_here"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    def get_allowed_origins_list(self) -> list:
        """Get list of allowed CORS origins."""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    def ensure_directories(self):
        """Ensure all required directories exist."""
        Path(self.model_storage_path).mkdir(parents=True, exist_ok=True)
        Path(self.temp_data_path).mkdir(parents=True, exist_ok=True)
        Path(os.path.dirname(self.log_file)).mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = Settings()
settings.ensure_directories()
