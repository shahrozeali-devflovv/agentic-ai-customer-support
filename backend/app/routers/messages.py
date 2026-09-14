from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agent.graph import build_agent_graph
from app.db.session import get_db
from app.dependencies.auth import (
    get_current_user,
    require_admin,
    require_support_or_admin,
)
from app.models.escalation import Escalation
from app.models.user import User, UserRole
from app.schemas.message import (
    AgentMessageResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.conversation_service import (
    get_conversation_by_id,
    get_conversation_for_user,
)
from app.services.message_service import (
    create_ai_message,
    create_customer_message,
    create_support_message,
    get_messages_for_conversation,
)


router = APIRouter(
    prefix="/conversations/{conversation_id}/messages",
    tags=["Messages"],
)


def support_has_access_to_conversation(
    db: Session,
    conversation_id: int,
    user_id: int,
) -> bool:
    escalation = db.scalar(
        select(Escalation).where(
            Escalation.conversation_id == conversation_id,
            Escalation.assigned_to_user_id == user_id,
        )
    )

    return escalation is not None


@router.post(
    "",
    response_model=AgentMessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentMessageResponse:
    conversation = get_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    customer_message = create_customer_message(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        content=message_data.content,
    )

    agent_graph = build_agent_graph(
        db=db,
    )

    agent_result = agent_graph.invoke(
        {
            "message": message_data.content,
            "user_id": current_user.id,
        }
    )

    agent_answer = agent_result.get(
        "answer"
    )

    ai_message = None

    if agent_answer:
        ai_message = create_ai_message(
            db=db,
            conversation_id=conversation_id,
            content=agent_answer,
        )

    orders = agent_result.get(
        "orders"
    )

    return AgentMessageResponse(
        customer_message=customer_message,
        ai_message=ai_message,
        orders=orders,
    )


@router.get(
    "/admin",
    response_model=list[MessageResponse],
)
def get_admin_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> list[MessageResponse]:
    conversation = get_conversation_by_id(
        db=db,
        conversation_id=conversation_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    return get_messages_for_conversation(
        db=db,
        conversation_id=conversation_id,
    )


@router.get(
    "/support",
    response_model=list[MessageResponse],
)
def get_support_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_support_or_admin,
    ),
) -> list[MessageResponse]:
    conversation = get_conversation_by_id(
        db=db,
        conversation_id=conversation_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    if current_user.role == UserRole.SUPPORT:
        has_access = support_has_access_to_conversation(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This conversation is not assigned to you",
            )

    return get_messages_for_conversation(
        db=db,
        conversation_id=conversation_id,
    )


@router.post(
    "/support",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def send_support_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_support_or_admin,
    ),
) -> MessageResponse:
    conversation = get_conversation_by_id(
        db=db,
        conversation_id=conversation_id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    if current_user.role == UserRole.SUPPORT:
        has_access = support_has_access_to_conversation(
            db=db,
            conversation_id=conversation_id,
            user_id=current_user.id,
        )

        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This conversation is not assigned to you",
            )

    return create_support_message(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
        content=message_data.content,
    )


@router.get(
    "",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MessageResponse]:
    conversation = get_conversation_for_user(
        db=db,
        conversation_id=conversation_id,
        user_id=current_user.id,
    )

    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    return get_messages_for_conversation(
        db=db,
        conversation_id=conversation_id,
    )