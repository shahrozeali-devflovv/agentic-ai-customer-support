from sqlalchemy.orm import Session
from langgraph.graph import END, START, StateGraph

from app.agent.intent_classifier import (
    Intent,
    classify_intent,
)
from app.agent.state import AgentState
from app.services.rag_service import (
    answer_with_knowledge_base,
)


def classify_node(
    state: AgentState,
) -> AgentState:
    intent = classify_intent(
        state["message"]
    )

    return {
        "intent": intent,
    }


def knowledge_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    result = answer_with_knowledge_base(
        db=db,
        question=state["message"],
    )

    if not result.has_context:
        return {
            "answer": None,
            "has_context": False,
            "needs_escalation": True,
        }

    return {
        "answer": result.answer,
        "has_context": True,
        "needs_escalation": False,
    }


def fallback_node(
    state: AgentState,
) -> AgentState:
    return {
        "answer": None,
        "has_context": False,
        "needs_escalation": True,
    }


def route_by_intent(
    state: AgentState,
) -> str:
    if state["intent"] == Intent.KNOWLEDGE:
        return "knowledge"

    return "fallback"


def build_agent_graph(
    db: Session,
):
    graph = StateGraph(
        AgentState
    )

    graph.add_node(
        "classify",
        classify_node,
    )

    graph.add_node(
        "knowledge",
        lambda state: knowledge_node(
            state,
            db,
        ),
    )

    graph.add_node(
        "fallback",
        fallback_node,
    )

    graph.add_edge(
        START,
        "classify",
    )

    graph.add_conditional_edges(
        "classify",
        route_by_intent,
        {
            "knowledge": "knowledge",
            "fallback": "fallback",
        },
    )

    graph.add_edge(
        "knowledge",
        END,
    )

    graph.add_edge(
        "fallback",
        END,
    )

    return graph.compile()