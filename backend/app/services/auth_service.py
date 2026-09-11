from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    generate_password_reset_token,
    hash_password,
    hash_password_reset_token,
    verify_password,
)
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User, UserRole
from app.schemas.auth import UserRegister


def register_user(
    db: Session,
    user_data: UserRegister,
) -> User:
    existing_user = db.scalar(
        select(User).where(User.email == user_data.email)
    )

    if existing_user is not None:
        raise ValueError("A user with this email already exists")

    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=UserRole.CUSTOMER,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None:
        return None

    if user.hashed_password is None:
        return None

    if not verify_password(
        password,
        user.hashed_password,
    ):
        return None

    if not user.is_active:
        return None

    return user


def create_password_reset(
    db: Session,
    email: str,
) -> str | None:
    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None or not user.is_active:
        return None

    reset_token = generate_password_reset_token()
    token_hash = hash_password_reset_token(reset_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=30,
    )

    password_reset = PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    db.add(password_reset)
    db.commit()

    return reset_token


def reset_password(
    db: Session,
    token: str,
    new_password: str,
) -> bool:
    token_hash = hash_password_reset_token(token)

    password_reset = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash
        )
    )

    if password_reset is None:
        return False

    if password_reset.used_at is not None:
        return False

    current_time = datetime.now(timezone.utc)

    if password_reset.expires_at <= current_time:
        return False

    user = db.get(
        User,
        password_reset.user_id,
    )

    if user is None or not user.is_active:
        return False

    user.hashed_password = hash_password(new_password)
    password_reset.used_at = current_time

    db.commit()

    return True