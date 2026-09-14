from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import UserRole
from app.services.user_service import (
    get_user_by_id,
)


@dataclass
class AccountToolResult:
    found: bool
    full_name: str | None
    email: str | None
    role: UserRole | None
    is_active: bool | None
    created_at: datetime | None


def get_customer_account(
    db: Session,
    user_id: int,
) -> AccountToolResult:
    user = get_user_by_id(
        db=db,
        user_id=user_id,
    )

    if user is None:
        return AccountToolResult(
            found=False,
            full_name=None,
            email=None,
            role=None,
            is_active=None,
            created_at=None,
        )

    return AccountToolResult(
        found=True,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
    )