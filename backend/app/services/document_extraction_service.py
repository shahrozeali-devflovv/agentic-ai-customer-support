from pathlib import Path

import fitz


def extract_text_from_pdf(file_path: str) -> str:
    pdf_path = Path(file_path)

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"PDF file not found: {file_path}"
        )

    extracted_pages: list[str] = []

    with fitz.open(pdf_path) as document:
        for page in document:
            page_text = page.get_text("text").strip()

            if page_text:
                extracted_pages.append(page_text)

    return "\n\n".join(extracted_pages).strip()