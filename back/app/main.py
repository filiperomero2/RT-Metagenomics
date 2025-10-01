from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from services.file_hash_calculator_service import FileHashCalculatorService
from routers import router as api_router
from exceptions import MetagenomicsError, handle_metagenomics_exception
from config import config
from infra.database.db import create_db_and_tables, get_session
from infra.dependencies import get_file_hash_calculator, get_metagenomics_run_repository
from services.viralunity_service import ViralUnityService
import threading
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize database
create_db_and_tables()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    
    # Start background service
    db_session = next(get_session())
    repository = get_metagenomics_run_repository(db_session)
    file_hash_calculator = get_file_hash_calculator()
    viralunity_service = ViralUnityService(repository, file_hash_calculator)
    thread = threading.Thread(target=viralunity_service.main, daemon=True)
    thread.start()
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    # Stop viralunity service
    
    # Set to pending all runs not finished and not errored
    
    db_session = next(get_session())
    db_session.close()
    logger.info("Database session closed")

app = FastAPI(
    title=config.api.title,
    version=config.api.version,
    description=config.api.description,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
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
