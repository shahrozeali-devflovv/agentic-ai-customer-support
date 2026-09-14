from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import Conversation
from app.models.escalation import Escalation, EscalationStatus
from app.models.user import User, UserRole


def create_escalation(
    db: Session,
    conversation_id: int,
    reason: str,
) -> Escalation | None:
    conversation = db.get(
        Conversation,
        conversation_id,
    )

    if conversation is None:
        return None

    existing_escalation = db.scalar(
        select(Escalation).where(
            Escalation.conversation_id
            == conversation_id,
            Escalation.status
            != EscalationStatus.RESOLVED,
        )
    )

    if existing_escalation is not None:
        return existing_escalation

    escalation = Escalation(
        conversation_id=conversation_id,
        reason=reason,
        status=EscalationStatus.OPEN,
    )

    db.add(escalation)
    db.commit()
    db.refresh(escalation)

    return escalation


def get_all_escalations(
    db: Session,
) -> list[Escalation]:
    escalations = db.scalars(
        select(Escalation).order_by(
            Escalation.created_at.desc(),
        )
    ).all()

    return list(escalations)


def get_escalations_assigned_to_user(
    db: Session,
    user_id: int,
) -> list[Escalation]:
    escalations = db.scalars(
        select(Escalation)
        .where(
            Escalation.assigned_to_user_id
            == user_id,
        )
        .order_by(
            Escalation.created_at.desc(),
        )
    ).all()

    return list(escalations)


def get_escalation_by_id(
    db: Session,
    escalation_id: int,
) -> Escalation | None:
    return db.scalar(
        select(Escalation).where(
            Escalation.id == escalation_id,
        )
    )


def assign_escalation(
    db: Session,
    escalation: Escalation,
    assigned_to_user_id: int,
) -> Escalation | None:
    assigned_user = db.scalar(
        select(User).where(
            User.id == assigned_to_user_id,
            User.is_active.is_(True),
        )
    )

    if assigned_user is None:
        return None

    if assigned_user.role not in {
        UserRole.ADMIN,
        UserRole.SUPPORT,
    }:
        return None

    escalation.assigned_to_user_id = (
        assigned_to_user_id
    )
    escalation.status = (
        EscalationStatus.ASSIGNED
    )

    db.commit()
    db.refresh(escalation)

    return escalation


def resolve_escalation(
    db: Session,
    escalation: Escalation,
) -> Escalation:
    escalation.status = (
        EscalationStatus.RESOLVED
    )
    escalation.resolved_at = datetime.now(
        timezone.utc,
    )

    db.commit()
    db.refresh(escalation)

    return escalation