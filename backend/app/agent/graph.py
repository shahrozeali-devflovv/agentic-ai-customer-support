from sqlalchemy.orm import Session
from langgraph.graph import END, START, StateGraph

from app.agent.intent_classifier import (
    Intent,
    classify_intent,
)
from app.agent.state import AgentState
from app.agent.tools.account_tool import (
    get_customer_account,
)
from app.agent.tools.order_tool import (
    OrderToolResult,
    extract_order_number,
    get_customer_order,
    get_customer_orders,
)
from app.services.escalation_service import (
    create_escalation,
)
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


def order_to_dict(
    order: OrderToolResult,
) -> dict:
    return {
        "order_number": order.order_number,
        "status": (
            order.status.value
            if order.status
            else None
        ),
        "total_amount": (
            str(order.total_amount)
            if order.total_amount is not None
            else None
        ),
        "currency": order.currency,
        "placed_at": (
            order.placed_at.isoformat()
            if order.placed_at
            else None
        ),
        "estimated_delivery_at": (
            order.estimated_delivery_at.isoformat()
            if order.estimated_delivery_at
            else None
        ),
        "delivered_at": (
            order.delivered_at.isoformat()
            if order.delivered_at
            else None
        ),
    }


def order_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    user_id = state.get(
        "user_id"
    )

    if user_id is None:
        return {
            "answer": None,
            "orders": None,
            "needs_escalation": True,
        }

    message = state["message"]

    order_number = extract_order_number(
        message
    )

    if order_number:
        order = get_customer_order(
            db=db,
            user_id=user_id,
            order_number=order_number,
        )

        if not order.found:
            return {
                "answer": (
                    f"I could not find {order_number} "
                    "in your account."
                ),
                "orders": [],
                "needs_escalation": False,
            }

        order_data = order_to_dict(
            order
        )

        answer_parts = [
            (
                f"Order {order.order_number} "
                f"is currently {order.status.value}."
            )
        ]

        if order.estimated_delivery_at:
            delivery_date = (
                order.estimated_delivery_at.strftime(
                    "%B %d, %Y"
                )
            )

            answer_parts.append(
                f"Estimated delivery is {delivery_date}."
            )

        if order.delivered_at:
            delivered_date = (
                order.delivered_at.strftime(
                    "%B %d, %Y"
                )
            )

            answer_parts.append(
                f"It was delivered on {delivered_date}."
            )

        return {
            "answer": " ".join(
                answer_parts
            ),
            "orders": [
                order_data
            ],
            "needs_escalation": False,
        }

    orders = get_customer_orders(
        db=db,
        user_id=user_id,
    )

    if not orders:
        return {
            "answer": (
                "I could not find any orders "
                "associated with your account."
            ),
            "orders": [],
            "needs_escalation": False,
        }

    order_data = [
        order_to_dict(order)
        for order in orders
    ]

    return {
        "answer": (
            f"I found {len(orders)} order"
            f"{'s' if len(orders) != 1 else ''} "
            "in your account. "
            "Please select the order you want "
            "more information about."
        ),
        "orders": order_data,
        "needs_escalation": False,
    }


def account_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    user_id = state.get(
        "user_id"
    )

    if user_id is None:
        return {
            "answer": None,
            "needs_escalation": True,
        }

    account = get_customer_account(
        db=db,
        user_id=user_id,
    )

    if not account.found:
        return {
            "answer": None,
            "needs_escalation": True,
        }

    message = state[
        "message"
    ].lower()

    if "email" in message:
        answer = (
            f"The email on your account is "
            f"{account.email}."
        )

    elif (
        "name" in message
        or "full name" in message
    ):
        answer = (
            f"The name on your account is "
            f"{account.full_name}."
        )

    elif (
        "active" in message
        or "status" in message
    ):
        if account.is_active:
            answer = (
                "Your account is currently active."
            )
        else:
            answer = (
                "Your account is currently inactive."
            )

    elif "role" in message:
        answer = (
            f"Your account role is "
            f"{account.role.value}."
        )

    else:
        answer = (
            f"Your account name is "
            f"{account.full_name}, "
            f"your email is {account.email}, "
            f"and your account is "
            f"{'active' if account.is_active else 'inactive'}."
        )

    return {
        "answer": answer,
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


def escalation_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    conversation_id = state.get(
        "conversation_id"
    )

    if conversation_id is None:
        return {
            "answer": (
                "I could not create a human support "
                "request for this conversation."
            ),
            "needs_escalation": True,
            "escalation_id": None,
        }

    intent = state.get(
        "intent"
    )

    if intent == Intent.HUMAN_SUPPORT:
        reason = (
            "Customer explicitly requested "
            "human support."
        )

    elif intent == Intent.ACCOUNT:
        reason = (
            "Account-related request requires "
            "human support."
        )

    elif intent == Intent.KNOWLEDGE:
        reason = (
            "The knowledge base did not contain "
            "enough trusted information to answer "
            "the customer's question."
        )

    elif intent == Intent.ORDER:
        reason = (
            "The order request could not be "
            "resolved automatically."
        )

    else:
        reason = (
            "The AI agent could not confidently "
            "resolve the customer's request."
        )

    escalation = create_escalation(
        db=db,
        conversation_id=conversation_id,
        reason=reason,
    )

    if escalation is None:
        return {
            "answer": (
                "I could not create a human support "
                "request at this time."
            ),
            "needs_escalation": True,
            "escalation_id": None,
        }

    return {
        "answer": (
            "I’m unable to resolve this automatically, "
            "so I’ve escalated this conversation to "
            "human support."
        ),
        "needs_escalation": True,
        "escalation_id": escalation.id,
    }


def route_by_intent(
    state: AgentState,
) -> str:
    if state["intent"] == Intent.KNOWLEDGE:
        return "knowledge"

    if state["intent"] == Intent.ORDER:
        return "order"

    if state["intent"] == Intent.ACCOUNT:
        return "account"

    if state["intent"] == Intent.HUMAN_SUPPORT:
        return "escalation"

    return "fallback"


def route_after_resolution(
    state: AgentState,
) -> str:
    if state.get(
        "needs_escalation",
        False,
    ):
        return "escalation"

    return "end"


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
        "order",
        lambda state: order_node(
            state,
            db,
        ),
    )

    graph.add_node(
        "account",
        lambda state: account_node(
            state,
            db,
        ),
    )

    graph.add_node(
        "fallback",
        fallback_node,
    )

    graph.add_node(
        "escalation",
        lambda state: escalation_node(
            state,
            db,
        ),
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
            "order": "order",
            "account": "account",
            "escalation": "escalation",
            "fallback": "fallback",
        },
    )

    graph.add_conditional_edges(
        "knowledge",
        route_after_resolution,
        {
            "escalation": "escalation",
            "end": END,
        },
    )

    graph.add_conditional_edges(
        "order",
        route_after_resolution,
        {
            "escalation": "escalation",
            "end": END,
        },
    )

    graph.add_conditional_edges(
        "account",
        route_after_resolution,
        {
            "escalation": "escalation",
            "end": END,
        },
    )

    graph.add_edge(
        "fallback",
        "escalation",
    )

    graph.add_edge(
        "escalation",
        END,
    )

    return graph.compile()