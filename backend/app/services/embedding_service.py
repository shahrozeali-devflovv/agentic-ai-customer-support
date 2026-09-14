import os

from google import genai
from google.genai import types


EMBEDDING_MODEL = "gemini-embedding-2"
EMBEDDING_DIMENSIONS = 768


def get_embedding_client() -> genai.Client:
    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured"
        )

    return genai.Client(
        api_key=api_key,
    )


def generate_embeddings(
    texts: list[str],
) -> list[list[float]]:
    if not texts:
        raise ValueError(
            "At least one text is required"
        )

    cleaned_texts = [
        text.strip()
        for text in texts
    ]

    if any(
        not text
        for text in cleaned_texts
    ):
        raise ValueError(
            "Embedding text cannot be empty"
        )

    client = get_embedding_client()

    result = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=cleaned_texts,
        config=types.EmbedContentConfig(
            output_dimensionality=(
                EMBEDDING_DIMENSIONS
            ),
        ),
    )

    if not result.embeddings:
        raise ValueError(
            "Embedding API returned no embeddings"
        )

    embeddings: list[list[float]] = []

    for embedding_result in result.embeddings:
        if embedding_result.values is None:
            raise ValueError(
                "Embedding values are missing"
            )

        embedding = list(
            embedding_result.values
        )

        if len(embedding) != EMBEDDING_DIMENSIONS:
            raise ValueError(
                "Embedding dimension does not match "
                f"expected size of {EMBEDDING_DIMENSIONS}"
            )

        embeddings.append(
            embedding
        )

    if len(embeddings) != len(cleaned_texts):
        raise ValueError(
            "Embedding count does not match text count"
        )

    return embeddings


def generate_embedding(
    text: str,
) -> list[float]:
    return generate_embeddings(
        [text]
    )[0]