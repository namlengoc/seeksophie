from typing import Iterable, List, Set

from schemas.article import TravelMagazineSchema


def _filter_valid_indices(sources: Iterable[int], max_index: int) -> List[int]:
    seen: Set[int] = set()
    valid: List[int] = []
    for idx in sources:
        if 0 <= idx < max_index and idx not in seen:
            seen.add(idx)
            valid.append(idx)
    return valid


def _filter_valid_filenames(filenames: Iterable[str], allowed: Set[str]) -> List[str]:
    seen: Set[str] = set()
    valid: List[str] = []
    for name in filenames:
        if name in allowed and name not in seen:
            seen.add(name)
            valid.append(name)
    return valid


def boundary_check(
    extracted: TravelMagazineSchema,
    chunk_count: int,
    image_filenames: List[str] | None = None,
) -> TravelMagazineSchema:
    """
    Post-LLM boundary check: remove source indices outside raw_content range
    and invalid suggested image filenames.
    """
    allowed_images = set(image_filenames or [])
    data = extracted.model_dump()

    data["intro_sources"] = _filter_valid_indices(data.get("intro_sources", []), chunk_count)
    data["best_for_sources"] = _filter_valid_indices(data.get("best_for_sources", []), chunk_count)
    data["not_for_sources"] = _filter_valid_indices(data.get("not_for_sources", []), chunk_count)
    data["ethics_sources"] = _filter_valid_indices(data.get("ethics_sources", []), chunk_count)

    for section in data.get("sections", []):
        section["sources"] = _filter_valid_indices(section.get("sources", []), chunk_count)
        section["suggested_images"] = _filter_valid_filenames(
            section.get("suggested_images", []),
            allowed_images,
        )

    for fact in data.get("key_facts", []):
        fact["sources"] = _filter_valid_indices(fact.get("sources", []), chunk_count)

    return TravelMagazineSchema.model_validate(data)
