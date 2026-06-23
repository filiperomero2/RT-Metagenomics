from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from services.file_hash_calculator_service import FileHashCalculatorService
from routers import router as api_router
from exceptions import MetagenomicsError, handle_metagenomics_exception
from config import config
from infra.database.db import create_db_and_tables, get_session
from infra.dependencies import (
    get_config_repository,
    get_file_hash_calculator,
    get_metagenomics_run_repository,
    get_paths_service,
)
from services.viralunity_service import ViralUnityService
from services.database_setup_service import DatabaseSetupService
from services.startup_status_service import startup_status_service
import threading
import logging

# Initialize logger
logger = logging.getLogger(__name__)

# ViralUnity and Snakemake use their own logger namespaces (not uvicorn.error).
# Align them with app LOG_LEVEL so pipeline INFO/ERROR reaches the same handlers as the API.
_level_name = (config.logging.level or "INFO").upper()
_pipeline_log_level = getattr(logging, _level_name, logging.INFO)
logging.getLogger("viralunity").setLevel(_pipeline_log_level)
logging.getLogger("snakemake").setLevel(_pipeline_log_level)


class _HealthAccessLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        return '"/v1/health' not in message and '"/health' not in message


logging.getLogger("uvicorn.access").addFilter(_HealthAccessLogFilter())

# Initialize database
create_db_and_tables()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up...")
    startup_status_service.update(
        phase="starting",
        progress_step=0,
        progress_total=0,
        progress_text="Backend starting...",
        error=None,
    )
    
    # Start background service
    db_session = next(get_session())
    repository = get_metagenomics_run_repository(db_session)
    file_hash_calculator = get_file_hash_calculator()
    paths_service = get_paths_service()
    startup_status_service.update(
        phase="starting_worker",
        progress_text="Starting background worker...",
        error=None,
    )
    viralunity_service = ViralUnityService(repository, file_hash_calculator, paths_service)
    thread = threading.Thread(target=viralunity_service.main, daemon=True)
    thread.start()

    startup_status_service.update(
        phase="bootstrapping_databases",
        progress_step=0,
        progress_total=5,
        progress_text="Preparing database bootstrap...",
        error=None,
    )

    def on_bootstrap_progress(step: int, total: int, message: str) -> None:
        from infra.download_progress import clear_download_progress

        clear_download_progress()
        startup_status_service.update(
            phase="bootstrapping_databases",
            progress_step=step,
            progress_total=total,
            progress_text=message,
            error=None,
        )

    def bootstrap_databases_in_background() -> None:
        thread_session = next(get_session())
        try:
            config_repository = get_config_repository(thread_session)
            database_setup_service = DatabaseSetupService(
                config_repository,
                get_paths_service(),
            )
            logger.info("Running startup database bootstrap via ViralUnity get-databases...")
            bootstrap_result = database_setup_service.bootstrap_all_databases(
                on_progress=on_bootstrap_progress,
            )
            logger.info(
                "Startup database bootstrap completed. Kraken2=%s Krona=%s Taxdump=%s",
                bootstrap_result.get("kraken2_database"),
                bootstrap_result.get("krona_database"),
                bootstrap_result.get("taxdump"),
            )
            startup_status_service.update(
                phase="ready",
                progress_step=5,
                progress_total=5,
                progress_text="Backend ready.",
                error=None,
            )
        except Exception as exc:  # noqa: BLE001
            startup_status_service.update(
                phase="degraded",
                progress_text="Database bootstrap failed, backend running in degraded mode.",
                error=str(exc),
            )
            logger.warning(
                "Startup database bootstrap failed, continuing startup: %s",
                exc,
                exc_info=True,
            )
        finally:
            thread_session.close()

    bootstrap_thread = threading.Thread(
        target=bootstrap_databases_in_background,
        daemon=True,
    )
    bootstrap_thread.start()
    
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
