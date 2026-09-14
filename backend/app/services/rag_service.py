from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.services.knowledge_search_service import (
    KnowledgeSearchResult,
    search_knowledge_chunks,
)
from app.services.llm_service import (
    generate_response,
)


INSUFFICIENT_CONTEXT = (
    "INSUFFICIENT_CONTEXT"
)


@dataclass
class RAGResult:
    answer: str | None
    sources: list[
        KnowledgeSearchResult
    ]
    has_context: bool


def answer_with_knowledge_base(
    db: Session,
    question: str,
) -> RAGResult:
    cleaned_question = (
        question.strip()
    )

    if not cleaned_question:
        raise ValueError(
            "Question cannot be empty"
        )

    search_results = (
        search_knowledge_chunks(
            db=db,
            query=cleaned_question,
        )
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

Answer the customer's question using only the
knowledge-base context provided below.

Rules:
- Do not invent information.
- Do not use outside knowledge.
- Only answer if the context directly contains
  enough information to answer the question.
- If the context does not contain enough information,
  return exactly:
  INSUFFICIENT_CONTEXT
- Do not add any explanation when returning
  INSUFFICIENT_CONTEXT.
- Otherwise, give a clear and concise customer
  support answer.

Knowledge-base context:

{context}

Customer question:

{cleaned_question}

Answer:
""".strip()

    answer = generate_response(
        prompt
    )

    if (
        answer.strip().upper()
        == INSUFFICIENT_CONTEXT
    ):
        return RAGResult(
            answer=None,
            sources=search_results,
            has_context=False,
        )

    return RAGResult(
        answer=answer,
        sources=search_results,
        has_context=True,
    )