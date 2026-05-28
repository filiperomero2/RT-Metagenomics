import logging
from typing import Annotated

import entities
from config import config
from fastapi import Depends
from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

logger = logging.getLogger("uvicorn.error")

engine = create_engine(
    config.database.url,
    connect_args={"check_same_thread": False},
    echo=config.database.echo,
)


def create_db_and_tables():
    logger.debug("Creating database and tables...")
    SQLModel.metadata.create_all(engine)
    _ensure_config_schema()
    logger.debug("Database and tables created successfully.")


def _ensure_config_schema():
    inspector = inspect(engine)
    if not inspector.has_table("config"):
        return

    columns = {column["name"] for column in inspector.get_columns("config")}
    if "is_default" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE config ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT 0")
        )


def get_session():
    with Session(engine) as session:
        yield session


DbSession = Annotated[Session, Depends(get_session)]
