import logging
from typing import List, Tuple

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from config import get_settings
from schemas.article import ProcessDocumentResponse, RawChunk
from schemas.language import DetectLanguageRequest, DetectLanguageResponse
from services.boundary_check import boundary_check
from services.docx_parser import parse_docx_to_chunks
from services.language_detect_service import LanguageDetectService
from services.llm_service import extract_article

logger = logging.getLogger(__name__)

app = FastAPI(title="Seek Sophie AI Service", version="1.0.0")

language_detect_service = LanguageDetectService()

ALLOWED_DOCX = {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
ALLOWED_IMAGE = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@app.get("/health")
async def health():
    settings = get_settings()
    return {
        "status": "ok",
        "llm_provider": settings.llm_provider,
        "has_openai_key": bool(settings.openai_api_key),
        "has_gemini_key": bool(settings.gemini_api_key),
    }


async def _read_upload(upload: UploadFile) -> bytes:
    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail=f"Empty file: {upload.filename}")
    return data


def _validate_docx(upload: UploadFile) -> None:
    content_type = (upload.content_type or "").lower()
    filename = (upload.filename or "").lower()
    if content_type not in ALLOWED_DOCX and not filename.endswith(".docx"):
        raise HTTPException(status_code=400, detail="document must be a .docx file")


def _validate_image(upload: UploadFile) -> None:
    content_type = (upload.content_type or "").lower()
    filename = (upload.filename or "").lower()
    if content_type not in ALLOWED_IMAGE and not any(
        filename.endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp")
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image type: {upload.filename}",
        )


def _sample_text_from_chunks(chunks: List[RawChunk]) -> str:
    if not chunks:
        return ""
    sample = "\n\n".join(chunk.text for chunk in chunks[:20])
    if len(sample.strip()) < 50:
        sample = "\n\n".join(chunk.text for chunk in chunks)
    return sample


@app.post("/v1/detect-language", response_model=DetectLanguageResponse)
async def detect_language(payload: DetectLanguageRequest) -> DetectLanguageResponse:
    return language_detect_service.detect(payload.text)


@app.post("/v1/detect-document-language", response_model=DetectLanguageResponse)
async def detect_document_language(document: UploadFile = File(...)) -> DetectLanguageResponse:
    _validate_docx(document)
    doc_bytes = await _read_upload(document)

    try:
        raw_chunks = parse_docx_to_chunks(doc_bytes)
    except Exception as exc:
        logger.exception("Failed to parse docx for language detect")
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {exc}") from exc

    sample = _sample_text_from_chunks(raw_chunks)
    if not sample.strip():
        raise HTTPException(status_code=422, detail="Document contains no readable paragraphs")

    return language_detect_service.detect(sample)


@app.post("/v1/process-document", response_model=ProcessDocumentResponse)
async def process_document(
    document: UploadFile = File(...),
    images: List[UploadFile] | None = None,
    source_lang: str = Form(default="en"),
):
    _validate_docx(document)
    doc_bytes = await _read_upload(document)

    image_uploads = images or []
    image_filenames: List[str] = []
    image_payloads: List[Tuple[str, bytes]] = []

    for image in image_uploads:
        _validate_image(image)
        image_bytes = await _read_upload(image)
        filename = image.filename or f"image_{len(image_filenames) + 1}.jpg"
        image_filenames.append(filename)
        image_payloads.append((filename, image_bytes))

    try:
        raw_chunks: List[RawChunk] = parse_docx_to_chunks(doc_bytes)
    except Exception as exc:
        logger.exception("Failed to parse docx")
        raise HTTPException(status_code=422, detail=f"Failed to parse document: {exc}") from exc

    if not raw_chunks:
        raise HTTPException(status_code=422, detail="Document contains no readable paragraphs")

    settings = get_settings()

    try:
        extracted = extract_article(
            settings, raw_chunks, image_filenames, image_payloads, source_lang=source_lang.strip().lower()
        )
    except Exception as exc:
        logger.exception("LLM extraction failed")
        raise HTTPException(status_code=502, detail=f"AI extraction failed: {exc}") from exc

    sanitized = boundary_check(extracted, len(raw_chunks), image_filenames)

    return ProcessDocumentResponse(raw_content=raw_chunks, extracted_data=sanitized)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception):
    logger.exception("Unhandled error")
    return JSONResponse(status_code=500, content={"detail": str(exc)})
