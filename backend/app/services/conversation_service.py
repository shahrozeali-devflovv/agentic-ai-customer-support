from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.escalation import Escalation
from app.schemas.conversation import ConversationCreate


def create_conversation(
    db: Session,
    user_id: int,
    conversation_data: ConversationCreate,
) -> Conversation:
    conversation = Conversation(
        user_id=user_id,
        title=conversation_data.title,
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


def get_conversation_for_support(
    db: Session,
    conversation_id: int,
    support_user_id: int,
) -> Conversation | None:
    return db.scalar(
        select(Conversation)
        .join(
            Escalation,
            Escalation.conversation_id == Conversation.id,
        )
        .where(
            Conversation.id == conversation_id,
            Escalation.assigned_to_user_id == support_user_id,
        )
    )


def get_conversations_for_user(
    db: Session,
    user_id: int,
) -> list[Conversation]:
    conversations = db.scalars(
        select(Conversation)
        .where(
            Conversation.user_id == user_id,
        )
        .order_by(
            Conversation.updated_at.desc(),
        )
    ).all()

    return list(conversations)


def get_conversation_for_user(
    db: Session,
    conversation_id: int,
    user_id: int,
) -> Conversation | None:
    return db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
    )


def get_all_conversations(
    db: Session,
) -> list[Conversation]:
    conversations = db.scalars(
        select(Conversation).order_by(
            Conversation.updated_at.desc(),
        )
    ).all()

    return list(conversations)


def get_conversation_by_id(
    db: Session,
    conversation_id: int,
) -> Conversation | None:
    return db.scalar(
        select(Conversation).where(
            Conversation.id == conversation_id,
        )
    )