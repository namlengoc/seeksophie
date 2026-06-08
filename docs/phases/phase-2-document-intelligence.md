# Phase 2: Multi-format Ingestion & Document Intelligence

**Status:** 📋 Planned  
**Dependencies:** Phase 1 ✅

---

## Goals

Expand input sources and improve document/image analysis.

---

## Checklist (not yet implemented)

### Ingestion Strategy Pattern (FastAPI)
- [ ] `DocumentParser` interface + factory by MIME/extension
- [ ] `.docx` parser (exists — refactor into strategy)
- [ ] PDF parser via `pdfplumber` (chunk by page)
- [ ] Raw Text / Slack URL parser
- [ ] Handwriting OCR via Google Cloud Vision (chunk by region)

### Extended Raw Chunks metadata
- [ ] Add `source_type` (`paragraph` | `page` | `ocr_region`)
- [ ] Add `page_number`, `bbox` (nullable) for PDF/OCR
- [ ] Update boundary check for new metadata

### Advanced multimodal
- [ ] Auto caption per uploaded image
- [ ] Deeper image analysis (color, activity, scenery) in prompt
- [ ] Smarter image placement suggestions (layout hints)

### Frontend
- [ ] Upload UI with PDF preview
- [ ] Show chunk metadata (page/region) in Original Notes tab

---

## Notes from Phase 1

Multi-image upload, carousel, and inline placement (max 3) **already exist** — Phase 2 focuses on new formats and deeper intelligence, not basic UI duplication.

---

[← Phase 1](./phase-1-core-ai-loop.md) · [Master plan](../project-master-plan.md) · [Phase 3 →](./phase-3-social-auth.md)
