from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies.auth import (
    require_admin,
    require_support_or_admin,
)
from app.models.user import User
from app.schemas.escalation import (
    EscalationAssignRequest,
    EscalationCreate,
    EscalationResponse,
)
from app.services.escalation_service import (
    assign_escalation,
    create_escalation,
    get_all_escalations,
    get_escalation_by_id,
    get_escalations_assigned_to_user,
    resolve_escalation,
)


router = APIRouter(
    prefix="/escalations",
    tags=["Escalations"],
)


@router.post(
    "",
    response_model=EscalationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_new_escalation(
    escalation_data: EscalationCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin,
    ),
) -> EscalationResponse:
    escalation = create_escalation(
        db=db,
        conversation_id=(
            escalation_data.conversation_id
        ),
        reason=escalation_data.reason,
    )

    if escalation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    return escalation


@router.get(
    "",
    response_model=list[EscalationResponse],
)
def get_escalations(
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin,
    ),
) -> list[EscalationResponse]:
    return get_all_escalations(
        db=db,
    )


@router.get(
    "/assigned-to-me",
    response_model=list[EscalationResponse],
)
def get_my_assigned_escalations(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_support_or_admin,
    ),
) -> list[EscalationResponse]:
    return get_escalations_assigned_to_user(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{escalation_id}",
    response_model=EscalationResponse,
)
def get_escalation(
    escalation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin,
    ),
) -> EscalationResponse:
    escalation = get_escalation_by_id(
        db=db,
        escalation_id=escalation_id,
    )

    if escalation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found",
        )

    return escalation


@router.patch(
    "/{escalation_id}/assign",
    response_model=EscalationResponse,
)
def assign_escalation_to_user(
    escalation_id: int,
    assignment_data: EscalationAssignRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin,
    ),
) -> EscalationResponse:
    escalation = get_escalation_by_id(
        db=db,
        escalation_id=escalation_id,
    )

    if escalation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found",
        )

    updated_escalation = assign_escalation(
        db=db,
        escalation=escalation,
        assigned_to_user_id=(
            assignment_data.assigned_to_user_id
        ),
    )

    if updated_escalation is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Escalation can only be "
                "assigned to an active admin "
                "or support user"
            ),
        )

    return updated_escalation


@router.patch(
    "/{escalation_id}/resolve",
    response_model=EscalationResponse,
)
def resolve_escalation_case(
    escalation_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin,
    ),
) -> EscalationResponse:
    escalation = get_escalation_by_id(
        db=db,
        escalation_id=escalation_id,
    )

    if escalation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Escalation not found",
        )

    return resolve_escalation(
        db=db,
        escalation=escalation,
    )