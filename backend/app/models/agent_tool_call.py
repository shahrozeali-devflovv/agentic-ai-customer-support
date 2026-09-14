from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
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


class AgentToolCall(Base):
    __tablename__ = "agent_tool_calls"

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    agent_run_id: Mapped[int] = mapped_column(
        ForeignKey(
            "agent_runs.id",
            ondelete="CASCADE",
        ),
        index=True,
        nullable=False,
    )

    tool_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    success: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
    )

    input_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    output_summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    duration_ms: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    agent_run: Mapped["AgentRun"] = relationship(
        back_populates="tool_calls",
    )