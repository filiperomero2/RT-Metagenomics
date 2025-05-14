from fastapi import FastAPI
from routers import router as api_router

app = FastAPI()

app.include_router(api_router)

@app.get("/health")
def read_root():
    return 'UP'