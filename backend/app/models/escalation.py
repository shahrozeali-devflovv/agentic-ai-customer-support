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


class EscalationStatus(str, Enum):
    OPEN = "open"
    ASSIGNED = "assigned"
    RESOLVED = "resolved"


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey("conversations.id"),
        index=True,
        nullable=False,
    )

    assigned_to_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        index=True,
        nullable=True,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    status: Mapped[EscalationStatus] = mapped_column(
        SQLAlchemyEnum(
            EscalationStatus,
            name="escalation_status",
            values_callable=lambda enum_class: [member.value for member in enum_class],
),
        default=EscalationStatus.OPEN,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    conversation: Mapped["Conversation"] = relationship(
        back_populates="escalations",
    )

    assigned_to_user: Mapped["User | None"] = relationship(
        back_populates="assigned_escalations",
        foreign_keys=[assigned_to_user_id],
    )