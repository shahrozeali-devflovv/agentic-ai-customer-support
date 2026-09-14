import re
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.order import OrderStatus
from app.services.order_service import (
    get_order_by_number_for_user,
    get_orders_for_user,
)


@dataclass
class OrderToolResult:
    found: bool
    order_number: str | None
    status: OrderStatus | None
    total_amount: Decimal | None
    currency: str | None
    placed_at: datetime | None
    estimated_delivery_at: datetime | None
    delivered_at: datetime | None


def extract_order_number(
    message: str,
) -> str | None:
    cleaned_message = message.strip()

    if not cleaned_message:
        return None

    match = re.search(
    r"\bORD-(?:[A-Z]+-)?\d+\b",
    cleaned_message,
    re.IGNORECASE,
    )

    if match is None:
        return None

    return match.group(0).upper()


def order_to_tool_result(
    order,
) -> OrderToolResult:
    return OrderToolResult(
        found=True,
        order_number=order.order_number,
        status=order.status,
        total_amount=order.total_amount,
        currency=order.currency,
        placed_at=order.placed_at,
        estimated_delivery_at=(
            order.estimated_delivery_at
        ),
        delivered_at=order.delivered_at,
    )


def get_customer_order(
    db: Session,
    user_id: int,
    order_number: str,
) -> OrderToolResult:
    cleaned_order_number = (
        order_number.strip().upper()
    )

    if not cleaned_order_number:
        raise ValueError(
            "Order number cannot be empty"
        )

    order = get_order_by_number_for_user(
        db=db,
        order_number=cleaned_order_number,
        user_id=user_id,
    )

    if order is None:
        return OrderToolResult(
            found=False,
            order_number=None,
            status=None,
            total_amount=None,
            currency=None,
            placed_at=None,
            estimated_delivery_at=None,
            delivered_at=None,
        )

    return order_to_tool_result(
        order
    )


def get_customer_orders(
    db: Session,
    user_id: int,
) -> list[OrderToolResult]:
    orders = get_orders_for_user(
        db=db,
        user_id=user_id,
    )

    return [
        order_to_tool_result(
            order
        )
        for order in orders
    ]