from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.knowledge_document import KnowledgeDocumentStatus


class KnowledgeDocumentCreate(BaseModel):
    title: str
    file_name: str
    file_type: str
    file_path: str


class KnowledgeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    file_name: str
    file_type: str
    file_path: str
    status: KnowledgeDocumentStatus
    uploaded_by_user_id: int
    created_at: datetime
    updated_at: datetime