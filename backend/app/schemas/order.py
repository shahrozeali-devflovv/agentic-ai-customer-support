from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.order import OrderStatus


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    status: OrderStatus
    total_amount: Decimal
    currency: str
    placed_at: datetime
    estimated_delivery_at: datetime | None
    delivered_at: datetime | None