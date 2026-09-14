from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.knowledge_document import (
    KnowledgeDocument,
    KnowledgeDocumentStatus,
)
from app.schemas.knowledge_document import KnowledgeDocumentCreate


def create_knowledge_document(
    db: Session,
    document_data: KnowledgeDocumentCreate,
    uploaded_by_user_id: int,
) -> KnowledgeDocument:
    document = KnowledgeDocument(
        title=document_data.title,
        file_name=document_data.file_name,
        file_type=document_data.file_type,
        file_path=document_data.file_path,
        status=KnowledgeDocumentStatus.UPLOADED,
        uploaded_by_user_id=uploaded_by_user_id,
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return document


def get_all_knowledge_documents(
    db: Session,
) -> list[KnowledgeDocument]:
    documents = db.scalars(
        select(KnowledgeDocument).order_by(
            KnowledgeDocument.created_at.desc()
        )
    ).all()

    return list(documents)


def get_knowledge_document_by_id(
    db: Session,
    document_id: int,
) -> KnowledgeDocument | None:
    return db.get(
        KnowledgeDocument,
        document_id,
    )


def update_knowledge_document_status(
    db: Session,
    document: KnowledgeDocument,
    new_status: KnowledgeDocumentStatus,
) -> KnowledgeDocument:
    document.status = new_status

    db.add(document)
    db.commit()
    db.refresh(document)

    return document