from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    openai_api_key: str = ""
    gemini_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_model: str = "gemini-2.5-flash-lite"
    llm_provider: str = "auto"  # auto | openai | gemini | mock


@lru_cache
def get_settings() -> Settings:
    return Settings()
