
from sqlmodel import Field, SQLModel, Relationship

from entities.enum import RunState
from entities.run_parameters import RunParameters
from typing import List
from .sample import Sample


class Run(SQLModel, table=True):    
    id: int | None = Field(default=None, primary_key=True)
    parametersId: int | None = Field(default=None, foreign_key="runparameters.id")
    state: RunState = Field(default=RunState.PENDING)
    errorMessage: str | None = Field(default=None)
    executionHash: str | None = Field(default=None)
    iteration: int = Field(default=1)
    
    # Relationships
    samples: List["Sample"] = Relationship(back_populates="run")
    parameters: RunParameters = Relationship(back_populates="run")