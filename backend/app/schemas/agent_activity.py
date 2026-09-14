from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.agent_run import AgentRunOutcome


class AgentToolCallResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_run_id: int
    tool_name: str
    success: bool
    input_summary: str | None
    output_summary: str | None
    error_message: str | None
    duration_ms: int | None
    created_at: datetime


class AgentRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    user_id: int
    customer_message: str
    intent: str | None
    outcome: AgentRunOutcome | None
    escalated: bool
    error_message: str | None
    started_at: datetime
    completed_at: datetime | None

    tool_calls: list[AgentToolCallResponse] = Field(
        default_factory=list,
    )