from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MessageSenderType(str, Enum):
    CUSTOMER = "customer"
    AI = "ai"
    SUPPORT = "support"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id"),
        index=True,
        nullable=False,
    )

    sender_type: Mapped[MessageSenderType] = mapped_column(
        SQLAlchemyEnum(
            MessageSenderType,
            name="message_sender_type",
            values_callable=lambda enum_class: [member.value for member in enum_class],
),
        nullable=False,
    )

    sender_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="messages",
    )

    sender_user: Mapped["User | None"] = relationship(
        back_populates="sent_messages",
        foreign_keys=[sender_user_id],
    )