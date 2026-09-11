from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserStatusUpdate, UserUpdate


def update_user_profile(
    db: Session,
    user: User,
    user_data: UserUpdate,
) -> User:
    user.full_name = user_data.full_name

    db.commit()
    db.refresh(user)

    return user


def get_all_users(
    db: Session,
) -> list[User]:
    users = db.scalars(
        select(User).order_by(User.id)
    ).all()

    return list(users)


def get_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:
    return db.get(
        User,
        user_id,
    )


def update_user_status(
    db: Session,
    user: User,
    status_data: UserStatusUpdate,
) -> User:
    user.is_active = status_data.is_active

    db.commit()
    db.refresh(user)

    return user