from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.knowledge_chunk import KnowledgeChunk
from app.services.embedding_service import generate_embedding


MAX_COSINE_DISTANCE = 0.35


@dataclass
class KnowledgeSearchResult:
    chunk: KnowledgeChunk
    distance: float


def search_knowledge_chunks(
    db: Session,
    query: str,
    limit: int = 5,
) -> list[KnowledgeSearchResult]:
    cleaned_query = query.strip()

    if not cleaned_query:
        raise ValueError(
            "Search query cannot be empty"
        )

    query_embedding = generate_embedding(
        cleaned_query
    )

    distance = (
        KnowledgeChunk.embedding.cosine_distance(
            query_embedding
        )
    )

    statement = (
        select(
            KnowledgeChunk,
            distance.label("distance"),
        )
        .where(
            KnowledgeChunk.embedding.is_not(
                None
            )
        )
        .order_by(distance)
        .limit(limit)
    )

    rows = db.execute(
        statement
    ).all()

    return [
        KnowledgeSearchResult(
            chunk=row[0],
            distance=float(row[1]),
        )
        for row in rows
        if float(row[1])
        <= MAX_COSINE_DISTANCE
    ]