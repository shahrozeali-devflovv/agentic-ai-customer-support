from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.escalation import EscalationStatus


class EscalationCreate(BaseModel):
    conversation_id: int
    reason: str


class EscalationAssignRequest(BaseModel):
    assigned_to_user_id: int


class EscalationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    assigned_to_user_id: int | None
    reason: str
    status: EscalationStatus
    created_at: datetime
    resolved_at: datetime | None