from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.message import (
    Message,
    MessageSenderType,
)


MAX_CONVERSATION_TITLE_LENGTH = 60


def build_conversation_title(
    content: str,
) -> str:
    cleaned_content = " ".join(
        content.strip().split()
    )

    if (
        len(cleaned_content)
        <= MAX_CONVERSATION_TITLE_LENGTH
    ):
        return cleaned_content

    return (
        cleaned_content[
            :MAX_CONVERSATION_TITLE_LENGTH
        ].rstrip()
        + "..."
    )


def set_conversation_title_from_first_message(
    db: Session,
    conversation_id: int,
    content: str,
) -> None:
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
        )
    )

    if conversation is None:
        return

    if conversation.title:
        return

    conversation.title = (
        build_conversation_title(
            content
        )
    )


def create_customer_message(
    db: Session,
    conversation_id: int,
    user_id: int,
    content: str,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        sender_type=MessageSenderType.CUSTOMER,
        sender_user_id=user_id,
        content=content,
    )

    db.add(message)

    set_conversation_title_from_first_message(
        db=db,
        conversation_id=conversation_id,
        content=content,
    )

    db.commit()
    db.refresh(message)

    return message


def create_ai_message(
    db: Session,
    conversation_id: int,
    content: str,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        sender_type=MessageSenderType.AI,
        sender_user_id=None,
        content=content,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def create_support_message(
    db: Session,
    conversation_id: int,
    user_id: int,
    content: str,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        sender_type=MessageSenderType.SUPPORT,
        sender_user_id=user_id,
        content=content,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


def get_messages_for_conversation(
    db: Session,
    conversation_id: int,
) -> list[Message]:
    messages = db.scalars(
        select(Message)
        .where(
            Message.conversation_id
            == conversation_id,
        )
        .order_by(
            Message.created_at
        )
    ).all()

    return list(messages)


def get_recent_messages_for_conversation(
    db: Session,
    conversation_id: int,
    limit: int = 10,
) -> list[Message]:
    messages = db.scalars(
        select(Message)
        .where(
            Message.conversation_id
            == conversation_id,
        )
        .order_by(
            Message.created_at.desc(),
        )
        .limit(limit)
    ).all()

    return list(
        reversed(messages)
    )