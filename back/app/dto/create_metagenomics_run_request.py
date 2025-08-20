from typing import List
from entities.enum import DataType

class CreateMetagenomicsSampleRequest:
    name: str
    barcode: str
    
class CreateMetagenomicsRunRequest:
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
