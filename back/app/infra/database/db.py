from sqlalchemy import create_engine
from sqlmodel import  Session, SQLModel, create_engine
from typing import Annotated
from fastapi import Depends
import logging

import entities

DATABASE_URL = "sqlite:///rtmeta.db" 

logger = logging.getLogger('uvicorn.error')

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)

def create_db_and_tables():
    logger.debug("Creating database and tables...")
    SQLModel.metadata.create_all(engine)
    logger.debug("Database and tables created successfully.")
    
def get_session():
    with Session(engine) as session:
        yield session
        
DbSession = Annotated[Session, Depends(get_session)]