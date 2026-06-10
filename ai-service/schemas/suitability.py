from pydantic import BaseModel, Field


class DocumentSuitabilityAssessment(BaseModel):
    suitable: bool = Field(
        description="True only if the document is travel-experience notes suitable for a magazine article"
    )
    reason: str = Field(
        description="Short user-facing explanation (why suitable or why rejected)"
    )
    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in the suitability decision (0-1)",
    )
