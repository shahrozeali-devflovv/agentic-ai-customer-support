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
)
from app.models.user import User
from app.schemas.agent_activity import (
    AgentRunResponse,
)
from app.services.agent_logging_service import (
    get_agent_run_by_id,
    get_agent_runs,
)


router = APIRouter(
    prefix="/agent-activity",
    tags=["Agent Activity"],
)


@router.get(
    "",
    response_model=list[AgentRunResponse],
)
def list_agent_runs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin
    ),
) -> list[AgentRunResponse]:
    return get_agent_runs(
        db=db,
    )


@router.get(
    "/{agent_run_id}",
    response_model=AgentRunResponse,
)
def get_agent_run(
    agent_run_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(
        require_admin
    ),
) -> AgentRunResponse:
    agent_run = get_agent_run_by_id(
        db=db,
        agent_run_id=agent_run_id,
    )

    if agent_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent run not found",
        )

    return agent_run