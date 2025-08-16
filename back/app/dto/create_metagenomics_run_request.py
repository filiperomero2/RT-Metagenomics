from typing import List
from entities.enum import DataType
from pydantic import BaseModel

class CreateMetagenomicsSampleRequest(BaseModel):
    name: str
    barcode: str
    
class CreateMetagenomicsRunRequest(BaseModel):
    dataType: DataType
    samples: List[CreateMetagenomicsSampleRequest]
    runName: str
    trim: int
    threads: int
    threadsTotal: int
    removeHumanReads: bool
    removeUnclassifiedReads: bool
    minimumReadLength: int
    kraken2Database: str
    kronaDatabase: str
