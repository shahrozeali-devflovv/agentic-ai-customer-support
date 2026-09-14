import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.knowledge_document import (
    KnowledgeDocumentCreate,
    KnowledgeDocumentResponse,
)
from app.services.knowledge_document_service import (
    create_knowledge_document,
    get_all_knowledge_documents,
    get_knowledge_document_by_id,
)
from app.services.knowledge_processing_service import (
    process_knowledge_document,
)

router = APIRouter(
    prefix="/knowledge-documents",
    tags=["Knowledge Documents"],
)

STORAGE_DIRECTORY = Path(
    "storage/knowledge-base"
)
STORAGE_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True,
)

ALLOWED_FILE_TYPES = {
    "application/pdf",
}


@router.post(
    "",
    response_model=KnowledgeDocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> KnowledgeDocumentResponse:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A file is required",
        )

    original_file_name = Path(
        file.filename
    ).name

    file_extension = Path(
        original_file_name
    ).suffix.lower()

    if (
        file.content_type not in ALLOWED_FILE_TYPES
        or file_extension != ".pdf"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are currently supported",
        )

    stored_file_name = (
        f"{uuid4().hex}{file_extension}"
    )

    file_path = (
        STORAGE_DIRECTORY
        / stored_file_name
    )

    try:
        with file_path.open("wb") as destination:
            shutil.copyfileobj(
                file.file,
                destination,
            )

    except Exception:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save uploaded file",
        )

    finally:
        await file.close()

    document_data = KnowledgeDocumentCreate(
        title=title,
        file_name=original_file_name,
        file_type=file.content_type,
        file_path=str(file_path),
    )

    document = create_knowledge_document(
        db=db,
        document_data=document_data,
        uploaded_by_user_id=current_admin.id,
    )

    try:
        document = process_knowledge_document(
            db=db,
            document_id=document.id,
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Document was uploaded, "
                "but processing failed"
            ),
        )

    return document


@router.get(
    "",
    response_model=list[KnowledgeDocumentResponse],
)
def list_documents(
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> list[KnowledgeDocumentResponse]:
    return get_all_knowledge_documents(
        db
    )


@router.get(
    "/{document_id}",
    response_model=KnowledgeDocumentResponse,
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_admin),
) -> KnowledgeDocumentResponse:
    document = get_knowledge_document_by_id(
        db=db,
        document_id=document_id,
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge document not found",
        )

    return document