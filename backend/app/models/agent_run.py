from datetime import datetime
from enum import Enum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLAlchemyEnum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db.base import Base


class AgentRunOutcome(str, Enum):
    ANSWERED = "answered"
    ESCALATED = "escalated"
    FAILED = "failed"


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    conversation_id: Mapped[int] = mapped_column(
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    customer_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    intent: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    outcome: Mapped[AgentRunOutcome | None] = mapped_column(
        SQLAlchemyEnum(
            AgentRunOutcome,
            name="agent_run_outcome",
            values_callable=lambda enum_class: [
                member.value
                for member in enum_class
            ],
        ),
        nullable=True,
    )

    escalated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    conversation: Mapped["Conversation"] = relationship()

    user: Mapped["User"] = relationship()

    tool_calls: Mapped[list["AgentToolCall"]] = relationship(
        back_populates="agent_run",
        cascade="all, delete-orphan",
    )