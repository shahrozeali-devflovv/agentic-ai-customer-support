from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class KnowledgeDocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    file_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    status: Mapped[KnowledgeDocumentStatus] = mapped_column(
        SQLAlchemyEnum(
            KnowledgeDocumentStatus,
            name="knowledge_document_status",
            values_callable=lambda enum_class: [
                member.value for member in enum_class
            ],
        ),
        default=KnowledgeDocumentStatus.UPLOADED,
        nullable=False,
    )

    uploaded_by_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    uploaded_by_user: Mapped["User"] = relationship(
        back_populates="knowledge_documents",
    )

    chunks: Mapped[list["KnowledgeChunk"]] = relationship(
        back_populates="knowledge_document",
        cascade="all, delete-orphan",
    )