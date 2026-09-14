from typing import TypedDict

from app.agent.intent_classifier import Intent


class AgentState(TypedDict, total=False):
    message: str

    user_id: int

    conversation_id: int

    agent_run_id: int

    intent: Intent

    answer: str | None

    orders: list[dict] | None

    has_context: bool

    needs_escalation: bool

    escalation_id: int | None