import logging

from langdetect import DetectorFactory, LangDetectException, detect_langs

from schemas.language import DetectLanguageResponse
from services.language_script_detect import detect_language_from_script, normalize_langdetect_code

DetectorFactory.seed = 0

logger = logging.getLogger("ai_service.language_detect")

_SUPPORTED = frozenset({"vi", "en", "ja", "ko", "zh-cn", "th", "id", "es", "fr", "de"})


class LanguageDetectService:
    def detect(self, text: str) -> DetectLanguageResponse:
        cleaned = text.strip()
        if cleaned == "":
            return DetectLanguageResponse(lang="unknown", confidence=0.0, is_reliable=False)

        script_lang = detect_language_from_script(cleaned)
        if script_lang is not None:
            return DetectLanguageResponse(lang=script_lang, confidence=0.99, is_reliable=True)

        try:
            candidates = detect_langs(cleaned)
        except LangDetectException as exc:
            logger.warning("language_detect failed: %s", exc)
            return DetectLanguageResponse(lang="unknown", confidence=0.0, is_reliable=False)

        if not candidates:
            return DetectLanguageResponse(lang="unknown", confidence=0.0, is_reliable=False)

        for candidate in candidates:
            lang = normalize_langdetect_code(str(candidate.lang))
            confidence = float(candidate.prob)
            if lang in _SUPPORTED and confidence >= 0.5:
                return DetectLanguageResponse(
                    lang=lang,
                    confidence=confidence,
                    is_reliable=confidence >= 0.85,
                )

        logger.info(
            "language_detect no supported match; top=%s",
            [(c.lang, c.prob) for c in candidates[:3]],
        )
        return DetectLanguageResponse(lang="unknown", confidence=0.0, is_reliable=False)
