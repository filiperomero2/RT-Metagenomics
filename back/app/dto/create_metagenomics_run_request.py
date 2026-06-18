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
    path: str
    trim: int
    threads: int
    threadsTotal: int
    removeHumanReads: bool
    removeUnclassifiedReads: bool
    minimumReadLength: int
    kraken2Database: str
    kronaDatabase: str
    diamondDatabase: str | None = None
    taxdump: str | None = None
    taxids: str | None = None
    runDiamondReads: bool = False
    runDiamondContigs: bool = False
    runDenovoAssembly: bool = False
