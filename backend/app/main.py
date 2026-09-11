from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import check_database_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


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