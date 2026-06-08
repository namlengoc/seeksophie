from typing import List

from pydantic import BaseModel, Field


class RawChunk(BaseModel):
    index: int = Field(description="Paragraph index, starting at 0")
    text: str = Field(description="Original paragraph text")


class FactItem(BaseModel):
    fact_name: str = Field(description="e.g. Price, Duration, Best season, Transport")
    fact_value: str = Field(description="Specific value extracted directly from the raw notes")
    sources: List[int] = Field(
        description="Array of source paragraph indexes containing this factual information"
    )


class ArticleSection(BaseModel):
    heading: str = Field(description="Section heading for the article")
    content: str = Field(
        description="Section body written in engaging travel-magazine style, grounded in facts"
    )
    sources: List[int] = Field(
        description="Array of source paragraph indexes used as factual basis for this section"
    )
    suggested_images: List[str] = Field(
        description="Array of image FILENAMES suggested for this section; return [] if none",
    )


class TravelMagazineSchema(BaseModel):
    title: str = Field(description="Compelling experiential travel article title")
    intro_hook: str = Field(description="Engaging opening that hooks the reader")
    intro_sources: List[int] = Field(description="Source indexes for the intro")
    sections: List[ArticleSection] = Field(
        description="Article body split into clear sections with image placement suggestions"
    )
    best_for: List[str] = Field(description="Audiences best suited for this experience")
    best_for_sources: List[int] = Field(description="Source indexes for Best For")
    not_for: List[str] = Field(
        description="Audiences NOT suited (motion sickness, fear of heights, etc.)"
    )
    not_for_sources: List[int] = Field(description="Source indexes for Not For")
    ethics_safety: str = Field(
        description="Safety or ethics notes; empty string if not mentioned in sources",
    )
    ethics_sources: List[int] = Field(
        description="Source indexes for Ethics/Safety; return [] if none"
    )
    key_facts: List[FactItem] = Field(description="Table of core extracted facts")


class ProcessDocumentResponse(BaseModel):
    raw_content: List[RawChunk]
    extracted_data: TravelMagazineSchema
