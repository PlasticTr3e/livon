from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    internal_api_key: str
    model_dir: str = "models"

    class Config:
        env_file = ".env"

settings = Settings()