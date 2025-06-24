
from sqlmodel import Field, SQLModel

from entities.enum import RunState
from entities.metagenomics_parameters import MetagenomicsParameters



class MetagenomicRun(SQLModel, table=True):    
    id: int | None = Field(default=None, primary_key=True)
    parametersId: int | None = Field(default=None, foreign_key="metagenomicsparameters.id")
    state: RunState = Field(default=RunState.PENDING)
    
    errorMessage: str | None = None
    executionHash: str | None = None
    iteration: int  = 1
    
    # run_parameters: MetagenomicsParameters