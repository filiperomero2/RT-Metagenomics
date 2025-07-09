from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import router as api_router
from exceptions import MetagenomicsError, handle_metagenomics_exception
from config import config
from infra.database.db import create_db_and_tables
from infra.dependencies import get_viralunity_service, get_viralunity_domain_logic
from services.viralunity_service import ViralUnityService

# Initialize database
create_db_and_tables()

app = FastAPI(
    title=config.api.title,
    version=config.api.version,
    description=config.api.description,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.api.allow_origins,
    allow_credentials=config.api.allow_credentials,
    allow_methods=config.api.allow_methods,
    allow_headers=config.api.allow_headers,
)

# Global exception handler for custom exceptions
@app.exception_handler(MetagenomicsError)
async def metagenomics_exception_handler(request: Request, exc: MetagenomicsError):
    return JSONResponse(
        status_code=handle_metagenomics_exception(exc).status_code,
        content=handle_metagenomics_exception(exc).detail
    )

# Global exception handler for general exceptions
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "error_code": "INTERNAL_ERROR"
        }
    )

app.include_router(api_router)

@app.get("/health")
def read_root():
    return 'UP'

# Start background service
import threading
from infra.dependencies import get_viralunity_domain_logic

domain_logic = get_viralunity_domain_logic()
viralunity_service = ViralUnityService(domain_logic)
thread = threading.Thread(target=viralunity_service.main, daemon=True)
thread.start()
    