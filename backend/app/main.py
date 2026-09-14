from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import check_database_connection
from app.db.session import get_db
from app.routers.agent_activity import (
    router as agent_activity_router,
)
from app.routers.auth import (
    router as auth_router,
)
from app.routers.conversations import (
    router as conversations_router,
)
from app.routers.escalations import (
    router as escalations_router,
)
from app.routers.knowledge_documents import (
    router as knowledge_documents_router,
)
from app.routers.messages import (
    router as messages_router,
)
from app.routers.orders import (
    router as orders_router,
)
from app.routers.users import (
    router as users_router,
)


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(
    auth_router
)

app.include_router(
    users_router
)

app.include_router(
    orders_router
)

app.include_router(
    conversations_router
)

app.include_router(
    messages_router
)

app.include_router(
    escalations_router
)

app.include_router(
    knowledge_documents_router
)

app.include_router(
    agent_activity_router
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }


@app.get("/sqlalchemy-health")
def sqlalchemy_health_check(
    db: Session = Depends(get_db),
):
    result = db.execute(
        text("SELECT 1")
    ).scalar()

    return {
        "status": "ok",
        "database": "connected",
        "result": result,
    }


@app.get("/db-health")
def database_health_check():
    if check_database_connection():
        return {
            "status": "ok",
            "database": "connected",
        }

    return JSONResponse(
        status_code=503,
        content={
            "status": "error",
            "database": "unavailable",
        },
    )