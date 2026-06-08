"""Script/heuristic language hints before statistical langdetect (CJK, Thai, Vietnamese, etc.)."""

from __future__ import annotations

import re
from typing import Optional

_HIRAGANA = re.compile(r"[\u3040-\u309F]")
_KATAKANA = re.compile(r"[\u30A0-\u30FF]")
_CJK = re.compile(r"[\u4E00-\u9FFF]")
_HANGUL = re.compile(r"[\uAC00-\uD7AF]")
_THAI = re.compile(r"[\u0E00-\u0E7F]")
_VI_MARKS = re.compile(
    r"["
    r"\u00c0-\u024f"
    r"\u1e00-\u1eff"
    r"đĐ"
    r"]",
    re.UNICODE,
)

_LANGDETECT_ALIASES: dict[str, str] = {
    "zh-cn": "zh-cn",
    "zh-tw": "zh-cn",
}


def _letter_like_count(text: str) -> int:
    return sum(
        1
        for ch in text
        if ch.isalpha() or ("\u4e00" <= ch <= "\u9fff") or ("\u3040" <= ch <= "\u30ff")
    )


def detect_language_from_script(text: str) -> Optional[str]:
    cleaned = text.strip()
    if cleaned == "":
        return None

    hira = len(_HIRAGANA.findall(cleaned))
    kata = len(_KATAKANA.findall(cleaned))
    hangul = len(_HANGUL.findall(cleaned))
    thai = len(_THAI.findall(cleaned))
    vi_marks = len(_VI_MARKS.findall(cleaned))
    letters = _letter_like_count(cleaned)

    if letters < 10:
        return None

    if hangul >= max(3, int(letters * 0.08)):
        return "ko"

    if hira + kata >= max(2, int(letters * 0.02)):
        return "ja"

    if thai >= max(3, int(letters * 0.12)):
        return "th"

    if vi_marks >= max(4, int(letters * 0.03)):
        return "vi"

    return None


def normalize_langdetect_code(code: str) -> str:
    lowered = code.lower().strip()
    return _LANGDETECT_ALIASES.get(lowered, lowered)
