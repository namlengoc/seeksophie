from pydantic import BaseModel, Field


class DetectLanguageRequest(BaseModel):
    text: str = Field(..., min_length=1)


class DetectLanguageResponse(BaseModel):
    lang: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    is_reliable: bool
