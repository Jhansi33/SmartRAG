import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Server Settings
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # MongoDB Settings
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "domainspecificrag"

    # JWT Authentication
    JWT_SECRET_KEY: str = "94c8e75a96860d5b5467438e8cb50438cf38c4b9d03498ff2a5f7823f95e2fbd"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    # Vector storage
    VECTOR_STORAGE_DIR: str = "./vector_storage"

    # CORS Settings
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Optional Keys
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Load configuration from the parent directory's .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
