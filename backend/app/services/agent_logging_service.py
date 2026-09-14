from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import (
    Session,
    selectinload,
)

from app.models.agent_run import (
    AgentRun,
    AgentRunOutcome,
)
from app.models.agent_tool_call import (
    AgentToolCall,
)


def create_agent_run(
    db: Session,
    conversation_id: int,
    user_id: int,
    customer_message: str,
) -> AgentRun:
    agent_run = AgentRun(
        conversation_id=conversation_id,
        user_id=user_id,
        customer_message=customer_message,
        escalated=False,
    )

    db.add(agent_run)
    db.commit()
    db.refresh(agent_run)

    return agent_run


def complete_agent_run(
    db: Session,
    agent_run: AgentRun,
    intent: str | None,
    outcome: AgentRunOutcome,
    escalated: bool = False,
    error_message: str | None = None,
) -> AgentRun:
    agent_run.intent = intent
    agent_run.outcome = outcome
    agent_run.escalated = escalated
    agent_run.error_message = error_message
    agent_run.completed_at = datetime.now(
        timezone.utc
    )

    db.commit()
    db.refresh(agent_run)

    return agent_run


def create_tool_call_log(
    db: Session,
    agent_run_id: int,
    tool_name: str,
    success: bool,
    input_summary: str | None = None,
    output_summary: str | None = None,
    error_message: str | None = None,
    duration_ms: int | None = None,
) -> AgentToolCall:
    tool_call = AgentToolCall(
        agent_run_id=agent_run_id,
        tool_name=tool_name,
        success=success,
        input_summary=input_summary,
        output_summary=output_summary,
        error_message=error_message,
        duration_ms=duration_ms,
    )

    db.add(tool_call)
    db.commit()
    db.refresh(tool_call)

    return tool_call


def get_agent_runs(
    db: Session,
) -> list[AgentRun]:
    runs = db.scalars(
        select(AgentRun)
        .options(
            selectinload(
                AgentRun.tool_calls
            )
        )
        .order_by(
            AgentRun.started_at.desc()
        )
    ).all()

    return list(runs)


def get_agent_run_by_id(
    db: Session,
    agent_run_id: int,
) -> AgentRun | None:
    return db.scalar(
        select(AgentRun)
        .options(
            selectinload(
                AgentRun.tool_calls
            )
        )
        .where(
            AgentRun.id == agent_run_id,
        )
    )