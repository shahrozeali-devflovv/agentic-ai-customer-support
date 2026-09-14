from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.services.knowledge_search_service import (
    KnowledgeSearchResult,
    search_knowledge_chunks,
)
from app.services.llm_service import (
    generate_response,
)


@dataclass
class RAGResult:
    answer: str | None
    sources: list[KnowledgeSearchResult]
    has_context: bool


def answer_with_knowledge_base(
    db: Session,
    question: str,
) -> RAGResult:
    cleaned_question = question.strip()

    if not cleaned_question:
        raise ValueError(
            "Question cannot be empty"
        )

    search_results = search_knowledge_chunks(
        db=db,
        query=cleaned_question,
    )

    if not search_results:
        return RAGResult(
            answer=None,
            sources=[],
            has_context=False,
        )

    context_parts = [
        result.chunk.content
        for result in search_results
    ]

    context = "\n\n---\n\n".join(
        context_parts
    )

    prompt = f"""
You are a customer support assistant.

Answer the customer's question using only the information
provided in the knowledge-base context below.

Rules:
- Do not invent information.
- Do not use outside knowledge.
- If the context does not contain enough information,
  say that you do not have enough information.
- Keep the answer clear and concise.

Knowledge-base context:

{context}

Customer question:

{cleaned_question}

Answer:
""".strip()

    answer = generate_response(
        prompt
    )

    return RAGResult(
        answer=answer,
        sources=search_results,
        has_context=True,
    )