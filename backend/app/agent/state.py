from typing import TypedDict

from app.agent.intent_classifier import Intent


class AgentState(TypedDict, total=False):
    message: str
    intent: Intent
    answer: str | None
    has_context: bool
    needs_escalation: bool