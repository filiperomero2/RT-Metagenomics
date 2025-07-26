from typing import List
from entities.enum import DataType
from pydantic import BaseModel

class CreateMetagenomicsRunRequest(BaseModel):
    dataType: DataType
    samples: List[str]
    runName: str
    trim: int
    threads: int
    threadsTotal: int
    removeHumanReads: bool
    removeUnclassifiedReads: bool
    minimumReadLength: int
    kraken2Database: str
    kronaDatabase: str