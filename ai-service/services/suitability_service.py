import json
from typing import List

from config import Settings
from prompts import SUITABILITY_SYSTEM_PROMPT
from schemas.article import RawChunk
from schemas.suitability import DocumentSuitabilityAssessment
from services.llm_service import _resolve_provider

# Obvious non-travel signals for mock / heuristic fallback
_NON_TRAVEL_HINTS = (
    "python",
    "javascript",
    "typescript",
    "sql",
    "quarterly report",
    "meeting minutes",
    "invoice",
    "tax return",
    "software engineering",
    "pull request",
    "kubernetes",
    "react component",
)

_TRAVEL_HINTS = (
    "travel",
    "trip",
    "hotel",
    "hostel",
    "homestay",
    "trek",
    "hike",
    "flight",
    "airport",
    "beach",
    "temple",
    "market",
    "guide",
    "itinerary",
    "sapa",
    "chiang mai",
    "komodo",
    "sanctuary",
    "cable car",
    "ruong",
    "bậc thang",
    "旅",
    "旅行",
    "ホテル",
    "トレッキング",
)


def _chunks_sample(chunks: List[RawChunk], max_chunks: int = 25) -> str:
    return "\n\n".join(chunk.text for chunk in chunks[:max_chunks])


def _assess_with_heuristics(chunks: List[RawChunk]) -> DocumentSuitabilityAssessment:
    combined = _chunks_sample(chunks).lower()

    if len(combined.strip()) < 80:
        return DocumentSuitabilityAssessment(
            suitable=False,
            reason="The document is too short or empty to generate a travel article.",
            confidence=0.95,
        )

    for hint in _NON_TRAVEL_HINTS:
        if hint in combined:
            return DocumentSuitabilityAssessment(
                suitable=False,
                reason=(
                    "This document does not appear to be travel experience notes "
                    f"(detected non-travel topic: “{hint}”). "
                    "Please upload field notes about a destination, host, or experience."
                ),
                confidence=0.85,
            )

    travel_hits = sum(1 for hint in _TRAVEL_HINTS if hint in combined)
    if travel_hits == 0:
        return DocumentSuitabilityAssessment(
            suitable=False,
            reason=(
                "This document does not appear to contain travel experience notes. "
                "Upload rough notes about a trip, destination, activity, or host."
            ),
            confidence=0.75,
        )

    return DocumentSuitabilityAssessment(
        suitable=True,
        reason="Document appears to contain travel experience notes.",
        confidence=0.7,
    )


def _assess_with_openai(settings: Settings, chunks: List[RawChunk]) -> DocumentSuitabilityAssessment:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    payload = {
        "raw_chunks": [chunk.model_dump() for chunk in chunks],
        "instructions": (
            "Assess whether these paragraphs are rough travel field notes suitable for "
            "a Seek Sophie magazine article. Reject meeting notes, technical docs, "
            "invoices, generic essays, or any non-travel content."
        ),
    }

    completion = client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": SUITABILITY_SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False, indent=2)},
        ],
        response_format=DocumentSuitabilityAssessment,
        temperature=0.0,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise RuntimeError("OpenAI returned empty suitability assessment")
    return parsed


def _gemini_suitability_schema() -> dict:
    return {
        "type": "object",
        "properties": {
            "suitable": {"type": "boolean"},
            "reason": {"type": "string"},
            "confidence": {"type": "number"},
        },
        "required": ["suitable", "reason", "confidence"],
    }


def _assess_with_gemini(settings: Settings, chunks: List[RawChunk]) -> DocumentSuitabilityAssessment:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    payload = {
        "raw_chunks": [chunk.model_dump() for chunk in chunks],
        "instructions": (
            "Assess whether these paragraphs are rough travel field notes suitable for "
            "a Seek Sophie magazine article. Reject non-travel documents."
        ),
    }

    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=SUITABILITY_SYSTEM_PROMPT,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": _gemini_suitability_schema(),
            "temperature": 0.0,
        },
    )

    response = model.generate_content(json.dumps(payload, ensure_ascii=False, indent=2))
    return DocumentSuitabilityAssessment.model_validate_json(response.text)


def assess_document_suitability(settings: Settings, chunks: List[RawChunk]) -> DocumentSuitabilityAssessment:
    """Pre-flight check: should we generate a travel article from this document?"""
    if not chunks:
        return DocumentSuitabilityAssessment(
            suitable=False,
            reason="The document contains no readable paragraphs.",
            confidence=1.0,
        )

    provider = _resolve_provider(settings)

    if provider == "openai":
        return _assess_with_openai(settings, chunks)
    if provider == "gemini":
        return _assess_with_gemini(settings, chunks)
    return _assess_with_heuristics(chunks)
