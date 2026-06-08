# AI Service Specification (FastAPI & LLM Orchestration)

## 1. Document Ingestion Strategy (Python)

- **Goal:** Accept and normalize raw input documents into a common indexed paragraph structure for source attribution and anti-hallucination checks.
- **MVP Phase (.docx):** Use `python-docx` to iterate paragraphs. Empty lines are filtered out; each paragraph gets an `index` starting at `0`.
- **Raw Chunks layout:**
  ```json
  [
    {"index": 0, "text": "We departed Labuan Bajo pier at 8 a.m. on a small wooden boat..."},
    {"index": 1, "text": "The all-in price for swimming with whale sharks was $50 per person..."}
  ]
  ```
- **Multimodal image inputs:** User-uploaded images keep their original filenames (or hash IDs) as a list such as `["image_1.jpg", "image_2.png"]` and are passed to the LLM as visual context. Images are sent as base64 payloads alongside the JSON user prompt; map exact filenames into `suggested_images`.

---

## 2. Pydantic Response Schema (Strict Structured Output)

All LLM responses must be constrained to JSON via Pydantic:

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class FactItem(BaseModel):
    fact_name: str = Field(description="e.g. Price, Duration, Best season, Transport")
    fact_value: str = Field(description="Specific value extracted directly from the raw notes")
    sources: List[int] = Field(description="Source paragraph indexes for this fact")

class ArticleSection(BaseModel):
    heading: str = Field(description="Section heading")
    content: str = Field(description="Magazine-style section body grounded in sources")
    sources: List[int] = Field(description="Source indexes used for this section")
    suggested_images: List[str] = Field(description="Input image filenames suggested for this section")

class TravelMagazineSchema(BaseModel):
    title: str = Field(description="Compelling travel article title")
    intro_hook: str = Field(description="Engaging opening hook")
    intro_sources: List[int] = Field(description="Source indexes for the intro")
    sections: List[ArticleSection] = Field(description="Body sections with image suggestions")
    best_for: List[str] = Field(description="Best-suited audiences")
    best_for_sources: List[int] = Field(description="Source indexes for Best For")
    not_for: List[str] = Field(description="Audiences not suited")
    not_for_sources: List[int] = Field(description="Source indexes for Not For")
    ethics_safety: Optional[str] = Field(description="Safety/ethics notes if mentioned in sources")
    ethics_sources: List[int] = Field(description="Source indexes for Ethics/Safety")
    key_facts: List[FactItem] = Field(description="Core extracted facts")
```

---

## 3. Core System Prompt (Anti-Hallucination Engine)

Use this as the `system` message when calling OpenAI/Gemini. See `ai-service/prompts.py` for the live version.

```text
Role: You are the veteran Chief Editor of Seek Sophie's travel magazine...

ANTI-HALLUCINATION RULES (ABSOLUTE):
1. Magazine prose is allowed, but all facts must come from source paragraphs.
2. Every field must include accurate `sources` index arrays.
3. If a field has no source data, leave it empty or state (in the output language) that no information exists in the sources.
4. Multimodal: analyze images and place exact filenames in `suggested_images`.
5. Never use invalid chunk indexes.
```

---

## 4. Post-LLM Boundary Check (Backend Validation)

After receiving JSON from the LLM, `ai-service` must validate before returning to Laravel:

- Iterate all `sources` arrays in the response.
- If any index is outside the range of the original `raw_content` array, remove the invalid index to keep the UI safe.

---

## 5. Future Chunk Metadata (Scale-up)

For PDF (per page) or OCR (per region), extend raw chunks with optional fields:

- `source_type`: `paragraph` | `page` | `ocr_region`
- `page_number`, `bbox` (nullable)
