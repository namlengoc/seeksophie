import io
from typing import List

from docx import Document

from schemas.article import RawChunk


def parse_docx_to_chunks(file_bytes: bytes) -> List[RawChunk]:
    """Parse .docx into indexed raw chunks, skipping empty paragraphs."""
    document = Document(io.BytesIO(file_bytes))
    chunks: List[RawChunk] = []
    index = 0

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue
        chunks.append(RawChunk(index=index, text=text))
        index += 1

    return chunks
