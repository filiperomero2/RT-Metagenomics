from contextlib import asynccontextmanager
from services.viralunity_service import ViralUnityService
from infra.database.db import create_db_and_tables, get_session
from fastapi import FastAPI
from routers import router as api_router


create_db_and_tables()

app = FastAPI()

app.include_router(api_router)


@app.get("/health")
def read_root():
    return 'UP'

import threading
thread = threading.Thread(target=ViralUnityService().main)
thread.daemon = True  # Daemonize thread
thread.start()  # Start the thread