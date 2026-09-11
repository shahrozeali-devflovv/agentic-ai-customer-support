from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.order import Order


def get_orders_for_user(
    db: Session,
    user_id: int,
) -> list[Order]:
    orders = db.scalars(
        select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.placed_at.desc())
    ).all()

    return list(orders)


def get_order_for_user(
    db: Session,
    order_id: int,
    user_id: int,
) -> Order | None:
    return db.scalar(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == user_id,
        )
    )