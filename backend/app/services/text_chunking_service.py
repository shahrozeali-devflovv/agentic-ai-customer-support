def split_long_text(
    text: str,
    chunk_size: int,
    chunk_overlap: int,
) -> list[str]:
    chunks: list[str] = []

    step = chunk_size - chunk_overlap
    start = 0

    while start < len(text):
        end = start + chunk_size

        chunk = text[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += step

    return chunks


def chunk_text(
    text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 150,
) -> list[str]:
    cleaned_text = text.strip()

    if not cleaned_text:
        return []

    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be greater than 0"
        )

    if chunk_overlap < 0:
        raise ValueError(
            "chunk_overlap cannot be negative"
        )

    if chunk_overlap >= chunk_size:
        raise ValueError(
            "chunk_overlap must be smaller than chunk_size"
        )

    paragraphs = [
        paragraph.strip()
        for paragraph in cleaned_text.split("\n\n")
        if paragraph.strip()
    ]

    chunks: list[str] = []
    current_chunk = ""

    for paragraph in paragraphs:
        if len(paragraph) > chunk_size:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""

            long_paragraph_chunks = split_long_text(
                text=paragraph,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )

            chunks.extend(long_paragraph_chunks)
            continue

        candidate = (
            f"{current_chunk}\n\n{paragraph}".strip()
            if current_chunk
            else paragraph
        )

        if len(candidate) <= chunk_size:
            current_chunk = candidate
            continue

        chunks.append(current_chunk)

        overlap_text = current_chunk[
            -chunk_overlap:
        ].strip()

        candidate_with_overlap = (
            f"{overlap_text}\n\n{paragraph}".strip()
        )

        if len(candidate_with_overlap) <= chunk_size:
            current_chunk = candidate_with_overlap
        else:
            current_chunk = paragraph

    if current_chunk:
        chunks.append(current_chunk)

    return chunks