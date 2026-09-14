"""add agent activity logging

Revision ID: 53c49186798d
Revises: 9ff6c171b3e8
Create Date: 2026-09-14 19:30:18.568674
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "53c49186798d"
down_revision: Union[str, Sequence[str], None] = "9ff6c171b3e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.create_table(
        "agent_runs",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "conversation_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "customer_message",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "intent",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "outcome",
            sa.Enum(
                "answered",
                "escalated",
                "failed",
                name="agent_run_outcome",
            ),
            nullable=True,
        ),
        sa.Column(
            "escalated",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "completed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["conversations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_agent_runs_conversation_id"),
        "agent_runs",
        ["conversation_id"],
        unique=False,
    )

    op.create_index(
        op.f("ix_agent_runs_user_id"),
        "agent_runs",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "agent_tool_calls",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "agent_run_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "tool_name",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "success",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "input_summary",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "output_summary",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "error_message",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "duration_ms",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["agent_run_id"],
            ["agent_runs.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_agent_tool_calls_agent_run_id"),
        "agent_tool_calls",
        ["agent_run_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_index(
        op.f("ix_agent_tool_calls_agent_run_id"),
        table_name="agent_tool_calls",
    )

    op.drop_table(
        "agent_tool_calls"
    )

    op.drop_index(
        op.f("ix_agent_runs_user_id"),
        table_name="agent_runs",
    )

    op.drop_index(
        op.f("ix_agent_runs_conversation_id"),
        table_name="agent_runs",
    )

    op.drop_table(
        "agent_runs"
    )

    sa.Enum(
        name="agent_run_outcome"
    ).drop(
        op.get_bind(),
        checkfirst=True,
    )