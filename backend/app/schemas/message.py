from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.message import MessageSenderType


class MessageCreate(BaseModel):
    content: str = Field(
        min_length=1,
    )


class MessageResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: int
    conversation_id: int
    sender_type: MessageSenderType
    content: str
    created_at: datetime


class AgentMessageResponse(BaseModel):
    customer_message: MessageResponse
    ai_message: MessageResponse | None
    orders: list[dict[str, Any]] | None = None