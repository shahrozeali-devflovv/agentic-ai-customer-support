from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.message import Message, MessageSenderType


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
    db.commit()
    db.refresh(message)

    return message


def get_messages_for_conversation(
    db: Session,
    conversation_id: int,
) -> list[Message]:
    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    ).all()

    return list(messages)