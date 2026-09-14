from sqlalchemy.orm import Session

from app.models.knowledge_document import (
    KnowledgeDocument,
    KnowledgeDocumentStatus,
)
from app.services.document_extraction_service import (
    extract_text_from_pdf,
)
from app.services.knowledge_chunk_service import (
    replace_knowledge_chunks,
)
from app.services.knowledge_document_service import (
    get_knowledge_document_by_id,
    update_knowledge_document_status,
)
from app.services.text_chunking_service import chunk_text


def process_knowledge_document(
    db: Session,
    document_id: int,
) -> KnowledgeDocument:
    document = get_knowledge_document_by_id(
        db=db,
        document_id=document_id,
    )

    if document is None:
        raise ValueError(
            "Knowledge document not found"
        )

    update_knowledge_document_status(
        db=db,
        document=document,
        new_status=KnowledgeDocumentStatus.PROCESSING,
    )

    try:
        extracted_text = extract_text_from_pdf(
            document.file_path
        )

        if not extracted_text:
            raise ValueError(
                "No readable text was found in the PDF"
            )

        chunks = chunk_text(
            text=extracted_text,
        )

        if not chunks:
            raise ValueError(
                "No chunks could be created from the document"
            )

        replace_knowledge_chunks(
            db=db,
            knowledge_document_id=document.id,
            chunks=chunks,
        )

        document.status = KnowledgeDocumentStatus.READY

        db.add(document)
        db.commit()
        db.refresh(document)

        return document

    except Exception:
        db.rollback()

        failed_document = get_knowledge_document_by_id(
            db=db,
            document_id=document_id,
        )

        if failed_document is not None:
            update_knowledge_document_status(
                db=db,
                document=failed_document,
                new_status=KnowledgeDocumentStatus.FAILED,
            )

        raise