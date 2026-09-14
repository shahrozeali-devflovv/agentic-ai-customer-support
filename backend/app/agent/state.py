from typing import TypedDict

from app.agent.intent_classifier import Intent


class AgentState(TypedDict, total=False):
    message: str
    user_id: int

    intent: Intent

    answer: str | None

    orders: list[dict] | None

    has_context: bool

    needs_escalation: bool