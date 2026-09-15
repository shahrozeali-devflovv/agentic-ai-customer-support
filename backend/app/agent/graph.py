import re
from time import perf_counter

from langgraph.graph import END, START, StateGraph
from sqlalchemy.orm import Session

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
from app.models.message import MessageSenderType
from app.services.agent_logging_service import (
    create_tool_call_log,
)
from app.services.escalation_service import (
    create_escalation,
)
from app.services.llm_service import (
    generate_response,
)
from app.services.message_service import (
    get_recent_messages_for_conversation,
)
from app.services.rag_service import (
    answer_with_knowledge_base,
)


def log_tool_call(
    db: Session,
    state: AgentState,
    tool_name: str,
    success: bool,
    started_at: float,
    input_summary: str | None = None,
    output_summary: str | None = None,
    error_message: str | None = None,
) -> None:
    agent_run_id = state.get(
        "agent_run_id"
    )

    if agent_run_id is None:
        return

    duration_ms = int(
        (perf_counter() - started_at) * 1000
    )

    create_tool_call_log(
        db=db,
        agent_run_id=agent_run_id,
        tool_name=tool_name,
        success=success,
        input_summary=input_summary,
        output_summary=output_summary,
        error_message=error_message,
        duration_ms=duration_ms,
    )


def extract_order_selection_index(
    message: str,
) -> int | None:
    normalized = message.lower()

    patterns = {
        0: [
            r"\bfirst\b",
            r"\b1st\b",
            r"\bnumber 1\b",
        ],
        1: [
            r"\bsecond\b",
            r"\b2nd\b",
            r"\bnumber 2\b",
        ],
        2: [
            r"\bthird\b",
            r"\b3rd\b",
            r"\bnumber 3\b",
        ],
        3: [
            r"\bfourth\b",
            r"\b4th\b",
            r"\bnumber 4\b",
        ],
        4: [
            r"\bfifth\b",
            r"\b5th\b",
            r"\bnumber 5\b",
        ],
    }

    for index, expressions in patterns.items():
        for expression in expressions:
            if re.search(
                expression,
                normalized,
            ):
                return index

    return None


def conversation_has_order_selection_context(
    db: Session,
    conversation_id: int,
) -> bool:
    messages = get_recent_messages_for_conversation(
        db=db,
        conversation_id=conversation_id,
        limit=10,
    )

    for message in reversed(messages):
        if (
            message.sender_type == MessageSenderType.AI
            and "please select the order"
            in message.content.lower()
        ):
            return True

    return False


def classify_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    message = state["message"]

    selection_index = extract_order_selection_index(
        message
    )

    conversation_id = state.get(
        "conversation_id"
    )

    if (
        selection_index is not None
        and conversation_id is not None
        and conversation_has_order_selection_context(
            db=db,
            conversation_id=conversation_id,
        )
    ):
        return {
            "intent": Intent.ORDER,
        }

    intent = classify_intent(
        message
    )

    return {
        "intent": intent,
    }


def conversational_node(
    state: AgentState,
) -> AgentState:
    prompt = f"""
You are a friendly AI customer support assistant.

The customer sent a conversational message that does not require
database access or knowledge-base retrieval.

Respond briefly and naturally.

Rules:
- Be friendly and professional.
- Do not invent company policies.
- Do not invent order information.
- Do not invent account information.
- Do not claim that you performed an action.
- If the customer asks what you can help with, explain that you can
  help with orders, account information, company policies, and
  connecting them with human support.
- Keep the response concise.

Customer message:
{state["message"]}
""".strip()

    try:
        answer = generate_response(
            prompt
        )

        return {
            "answer": answer,
            "needs_escalation": False,
        }

    except Exception:
        return {
            "answer": (
                "Hello! How can I help you today?"
            ),
            "needs_escalation": False,
        }


def knowledge_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    started_at = perf_counter()

    try:
        result = answer_with_knowledge_base(
            db=db,
            question=state["message"],
        )

        log_tool_call(
            db=db,
            state=state,
            tool_name="knowledge_base_rag",
            success=True,
            started_at=started_at,
            input_summary="Knowledge-base question",
            output_summary=(
                "Grounded answer generated"
                if result.has_context
                else "Insufficient trusted context"
            ),
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

    except Exception as exc:
        log_tool_call(
            db=db,
            state=state,
            tool_name="knowledge_base_rag",
            success=False,
            started_at=started_at,
            input_summary="Knowledge-base question",
            error_message=str(exc),
        )

        return {
            "answer": None,
            "has_context": False,
            "needs_escalation": True,
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


def build_order_answer(
    order: OrderToolResult,
) -> str:
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

    return " ".join(
        answer_parts
    )


def order_node(
    state: AgentState,
    db: Session,
) -> AgentState:
    user_id = state.get(
        "user_id"
    )

    conversation_id = state.get(
        "conversation_id"
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

    selection_index = extract_order_selection_index(
        message
    )

    started_at = perf_counter()

    try:
        if order_number:
            order = get_customer_order(
                db=db,
                user_id=user_id,
                order_number=order_number,
            )

            log_tool_call(
                db=db,
                state=state,
                tool_name="get_customer_order",
                success=True,
                started_at=started_at,
                input_summary=(
                    f"order_number={order_number}"
                ),
                output_summary=(
                    (
                        f"status={order.status.value}"
                        if order.found and order.status
                        else "order_not_found"
                    )
                ),
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

            return {
                "answer": build_order_answer(
                    order
                ),
                "orders": [
                    order_to_dict(order)
                ],
                "needs_escalation": False,
            }

        if selection_index is not None:
            if conversation_id is None:
                return {
                    "answer": (
                        "Please ask me to show your orders "
                        "first, then select one."
                    ),
                    "orders": None,
                    "needs_escalation": False,
                }

            has_context = (
                conversation_has_order_selection_context(
                    db=db,
                    conversation_id=conversation_id,
                )
            )

            if not has_context:
                return {
                    "answer": (
                        "Please ask me to show your orders "
                        "first, then tell me which one "
                        "you want."
                    ),
                    "orders": None,
                    "needs_escalation": False,
                }

            orders = get_customer_orders(
                db=db,
                user_id=user_id,
            )

            if selection_index >= len(orders):
                return {
                    "answer": (
                        "That order selection is outside "
                        "the list of orders I found."
                    ),
                    "orders": [
                        order_to_dict(order)
                        for order in orders
                    ],
                    "needs_escalation": False,
                }

            selected_order = orders[
                selection_index
            ]

            log_tool_call(
                db=db,
                state=state,
                tool_name="get_customer_orders",
                success=True,
                started_at=started_at,
                input_summary=(
                    f"selection_index={selection_index}"
                ),
                output_summary=(
                    f"selected_order="
                    f"{selected_order.order_number}"
                ),
            )

            return {
                "answer": build_order_answer(
                    selected_order
                ),
                "orders": [
                    order_to_dict(
                        selected_order
                    )
                ],
                "needs_escalation": False,
            }

        orders = get_customer_orders(
            db=db,
            user_id=user_id,
        )

        log_tool_call(
            db=db,
            state=state,
            tool_name="get_customer_orders",
            success=True,
            started_at=started_at,
            input_summary="Authenticated customer",
            output_summary=(
                f"orders_found={len(orders)}"
            ),
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

    except Exception as exc:
        log_tool_call(
            db=db,
            state=state,
            tool_name=(
                "get_customer_order"
                if order_number
                else "get_customer_orders"
            ),
            success=False,
            started_at=started_at,
            input_summary=(
                f"order_number={order_number}"
                if order_number
                else "Authenticated customer"
            ),
            error_message=str(exc),
        )

        return {
            "answer": None,
            "orders": None,
            "needs_escalation": True,
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

    started_at = perf_counter()

    try:
        account = get_customer_account(
            db=db,
            user_id=user_id,
        )

        log_tool_call(
            db=db,
            state=state,
            tool_name="get_customer_account",
            success=True,
            started_at=started_at,
            input_summary="Authenticated customer",
            output_summary=(
                "account_found"
                if account.found
                else "account_not_found"
            ),
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
            answer = (
                "Your account is currently "
                f"{'active' if account.is_active else 'inactive'}."
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

    except Exception as exc:
        log_tool_call(
            db=db,
            state=state,
            tool_name="get_customer_account",
            success=False,
            started_at=started_at,
            input_summary="Authenticated customer",
            error_message=str(exc),
        )

        return {
            "answer": None,
            "needs_escalation": True,
        }


def fallback_node(
    state: AgentState,
) -> AgentState:
    return {
        "answer": (
            "I’m not sure what you need help with. "
            "I can assist with orders, account information, "
            "company policies, or connect you with human support."
        ),
        "has_context": False,
        "needs_escalation": False,
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
            "Account request could not be "
            "resolved automatically."
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

    started_at = perf_counter()

    try:
        escalation = create_escalation(
            db=db,
            conversation_id=conversation_id,
            reason=reason,
        )

        log_tool_call(
            db=db,
            state=state,
            tool_name="create_escalation",
            success=escalation is not None,
            started_at=started_at,
            input_summary=(
                f"conversation_id={conversation_id}"
            ),
            output_summary=(
                (
                    f"escalation_id={escalation.id}"
                    if escalation
                    else "escalation_not_created"
                )
            ),
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

    except Exception as exc:
        log_tool_call(
            db=db,
            state=state,
            tool_name="create_escalation",
            success=False,
            started_at=started_at,
            input_summary=(
                f"conversation_id={conversation_id}"
            ),
            error_message=str(exc),
        )

        return {
            "answer": (
                "I could not create a human support "
                "request at this time."
            ),
            "needs_escalation": True,
            "escalation_id": None,
        }


def route_by_intent(
    state: AgentState,
) -> str:
    if state["intent"] == Intent.CONVERSATIONAL:
        return "conversational"

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
        lambda state: classify_node(
            state,
            db,
        ),
    )

    graph.add_node(
        "conversational",
        conversational_node,
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
            "conversational": "conversational",
            "knowledge": "knowledge",
            "order": "order",
            "account": "account",
            "escalation": "escalation",
            "fallback": "fallback",
        },
    )

    graph.add_edge(
        "conversational",
        END,
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
        END,
    )

    graph.add_edge(
        "escalation",
        END,
    )

    return graph.compile()