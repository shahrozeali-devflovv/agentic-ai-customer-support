from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.knowledge_chunk import KnowledgeChunk


def replace_knowledge_chunks(
    db: Session,
    knowledge_document_id: int,
    chunks: list[str],
    embeddings: list[list[float]],
) -> list[KnowledgeChunk]:
    if len(chunks) != len(embeddings):
        raise ValueError(
            "Each chunk must have one embedding"
        )

    db.execute(
        delete(KnowledgeChunk).where(
            KnowledgeChunk.knowledge_document_id
            == knowledge_document_id
        )
    )

    chunk_records = [
        KnowledgeChunk(
            knowledge_document_id=(
                knowledge_document_id
            ),
            content=content,
            chunk_index=index,
            embedding=embedding,
        )
        for index, (
            content,
            embedding,
        ) in enumerate(
            zip(
                chunks,
                embeddings,
            )
        )
    ]

    db.add_all(
        chunk_records
    )
    db.flush()

    return chunk_records