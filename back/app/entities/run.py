
import datetime
from entities.enum import RunState
from sqlmodel import Field, SQLModel, Relationship
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from entities.run_parameters import RunParameters
    from entities.sample import Sample

class Run(SQLModel, table=True):    
    id: int | None = Field(default=None, primary_key=True)
    parametersId: int | None = Field(default=None, foreign_key="runparameters.id")
    name: str = Field(default=None)
    state: RunState = Field(default=RunState.PENDING)
    errorMessage: str | None = Field(default=None)
    executionHash: str | None = Field(default=None)
    iteration: int = Field(default=0)
    totalElapsedTimeOfAnalysisExecutionSeconds: float = Field(default=0)
    lastElapsedTimeOfAnalysisExecutionSeconds: float = Field(default=0)
    createdAt: datetime.datetime | None = Field(default=datetime.datetime.now())
    updatedAt: datetime.datetime | None = Field(default=datetime.datetime.now())
    next_scheduled_run_at: datetime.datetime | None = Field(default=datetime.datetime.now())
    
    # Relationships
    samples: List["Sample"] = Relationship(back_populates="run")
    parameters: "RunParameters" = Relationship(back_populates="run")
    
    def dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "state": self.state.value,
            "iteration": self.iteration,
            "errorMessage": self.errorMessage,
            "executionHash": self.executionHash,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt,
            "samples": [sample.dict() for sample in self.samples],
            "parameters": self.parameters.dict()
        }
        
    
    def __repr__(self):
        return f"Run(id={self.id}, name={self.name}, state={self.state.value}, iteration={self.iteration}, errorMessage={self.errorMessage}, executionHash={self.executionHash}, createdAt={self.createdAt}, updatedAt={self.updatedAt}, samples={self.samples}, parameters={self.parameters})"