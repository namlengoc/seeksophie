import base64
import json
import mimetypes
from typing import List, Tuple

from config import Settings
from prompts import CHIEF_EDITOR_SYSTEM_PROMPT, output_language_instruction
from schemas.article import ArticleSection, FactItem, RawChunk, TravelMagazineSchema


def _build_user_prompt(chunks: List[RawChunk], image_filenames: List[str], source_lang: str = "en") -> str:
    payload = {
        "raw_chunks": [chunk.model_dump() for chunk in chunks],
        "available_images": image_filenames,
        "source_lang": source_lang,
        "instructions": (
            "Transform the raw_chunks into a travel magazine article JSON. "
            "Every factual claim must cite valid chunk index values in sources arrays. "
            "When available_images is non-empty, analyze each photo and place exact filenames "
            "into suggested_images for the most relevant sections (at least one image if possible). "
            + output_language_instruction(source_lang)
        ),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _encode_image(image_bytes: bytes, filename: str) -> Tuple[str, str]:
    mime_type, _ = mimetypes.guess_type(filename)
    mime_type = mime_type or "image/jpeg"
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return mime_type, encoded


def _resolve_provider(settings: Settings) -> str:
    if settings.llm_provider != "auto":
        return settings.llm_provider
    if settings.openai_api_key:
        return "openai"
    if settings.gemini_api_key:
        return "gemini"
    return "mock"


def _extract_with_openai(
    settings: Settings,
    chunks: List[RawChunk],
    image_filenames: List[str],
    image_payloads: List[Tuple[str, bytes]],
    source_lang: str = "en",
) -> TravelMagazineSchema:
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    user_content: List[dict] = [
        {"type": "text", "text": _build_user_prompt(chunks, image_filenames, source_lang)}
    ]

    for filename, image_bytes in image_payloads:
        mime_type, encoded = _encode_image(image_bytes, filename)
        user_content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
            }
        )

    completion = client.beta.chat.completions.parse(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": CHIEF_EDITOR_SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        response_format=TravelMagazineSchema,
        temperature=0.3,
    )

    parsed = completion.choices[0].message.parsed
    if parsed is None:
        raise RuntimeError("OpenAI returned empty structured output")
    return parsed


def _gemini_response_schema() -> dict:
    """Inline JSON schema for Gemini (no $defs / default keys)."""
    section_schema = {
        "type": "object",
        "properties": {
            "heading": {"type": "string"},
            "content": {"type": "string"},
            "sources": {"type": "array", "items": {"type": "integer"}},
            "suggested_images": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["heading", "content", "sources", "suggested_images"],
    }
    fact_schema = {
        "type": "object",
        "properties": {
            "fact_name": {"type": "string"},
            "fact_value": {"type": "string"},
            "sources": {"type": "array", "items": {"type": "integer"}},
        },
        "required": ["fact_name", "fact_value", "sources"],
    }

    return {
        "type": "object",
        "properties": {
            "title": {"type": "string"},
            "intro_hook": {"type": "string"},
            "intro_sources": {"type": "array", "items": {"type": "integer"}},
            "sections": {"type": "array", "items": section_schema},
            "best_for": {"type": "array", "items": {"type": "string"}},
            "best_for_sources": {"type": "array", "items": {"type": "integer"}},
            "not_for": {"type": "array", "items": {"type": "string"}},
            "not_for_sources": {"type": "array", "items": {"type": "integer"}},
            "ethics_safety": {"type": "string"},
            "ethics_sources": {"type": "array", "items": {"type": "integer"}},
            "key_facts": {"type": "array", "items": fact_schema},
        },
        "required": [
            "title",
            "intro_hook",
            "intro_sources",
            "sections",
            "best_for",
            "best_for_sources",
            "not_for",
            "not_for_sources",
            "ethics_safety",
            "ethics_sources",
            "key_facts",
        ],
    }


def _extract_with_gemini(
    settings: Settings,
    chunks: List[RawChunk],
    image_filenames: List[str],
    image_payloads: List[Tuple[str, bytes]],
    source_lang: str = "en",
) -> TravelMagazineSchema:
    import google.generativeai as genai

    genai.configure(api_key=settings.gemini_api_key)
    system_instruction = (
        CHIEF_EDITOR_SYSTEM_PROMPT + "\n\n" + output_language_instruction(source_lang)
    )
    model = genai.GenerativeModel(
        model_name=settings.gemini_model,
        system_instruction=system_instruction,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": _gemini_response_schema(),
            "temperature": 0.3,
        },
    )

    parts: List[object] = [_build_user_prompt(chunks, image_filenames, source_lang)]
    for filename, image_bytes in image_payloads:
        mime_type, _ = _encode_image(image_bytes, filename)
        parts.append({"mime_type": mime_type, "data": image_bytes})

    response = model.generate_content(parts)
    return TravelMagazineSchema.model_validate_json(response.text)


def _extract_with_mock(chunks: List[RawChunk], image_filenames: List[str]) -> TravelMagazineSchema:
    """Deterministic fallback when no LLM API key is configured."""
    if not chunks:
        raise ValueError("Document contains no readable paragraphs")

    title_source = chunks[0]
    intro_source = chunks[0]
    body_chunks = chunks[1:] or [chunks[0]]

    sections: List[ArticleSection] = []
    for idx, chunk in enumerate(body_chunks[:4]):
        suggested = [image_filenames[idx]] if idx < len(image_filenames) else []
        sections.append(
            ArticleSection(
                heading=f"Experience Highlight {idx + 1}",
                content=chunk.text,
                sources=[chunk.index],
                suggested_images=suggested,
            )
        )

    key_facts = [
        FactItem(
            fact_name="Source excerpt",
            fact_value=chunk.text[:180],
            sources=[chunk.index],
        )
        for chunk in chunks[:3]
    ]

    return TravelMagazineSchema(
        title=title_source.text[:80],
        intro_hook=intro_source.text,
        intro_sources=[intro_source.index],
        sections=sections,
        best_for=["Curious travelers seeking authentic local experiences"],
        best_for_sources=[chunks[0].index],
        not_for=["No information in sources"],
        not_for_sources=[],
        ethics_safety="",
        ethics_sources=[],
        key_facts=key_facts,
    )


def extract_article(
    settings: Settings,
    chunks: List[RawChunk],
    image_filenames: List[str],
    image_payloads: List[Tuple[str, bytes]],
    source_lang: str = "en",
) -> TravelMagazineSchema:
    provider = _resolve_provider(settings)

    if provider == "openai":
        return _extract_with_openai(settings, chunks, image_filenames, image_payloads, source_lang)
    if provider == "gemini":
        return _extract_with_gemini(settings, chunks, image_filenames, image_payloads, source_lang)
    return _extract_with_mock(chunks, image_filenames)
