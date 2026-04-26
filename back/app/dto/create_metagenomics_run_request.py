from typing import List
from entities.enum import DataType
from pydantic import BaseModel, Field


class CreateMetagenomicsSampleRequest(BaseModel):
    name: str
    barcode: str
    isNegativeControl: bool = False


class CreateMetagenomicsRunRequest(BaseModel):
    dataType: DataType
    samples: List[CreateMetagenomicsSampleRequest]
    runName: str
    path: str
    threads: int
    threadsTotal: int
    removeHumanReads: bool
    removeUnclassifiedReads: bool
    minimumReadLength: int = Field(default=50)
    kraken2Database: str
    kronaDatabase: str

    adapters: str | None = None
    trimHead: int | None = Field(default=0)
    trimTail: int | None = Field(default=0)

    runDenovoAssembly: bool = False
    runKraken2Reads: bool = True
    runKraken2Contigs: bool = False
    runDiamondReads: bool = False
    runDiamondContigs: bool = False

    hostReference: str | None = None
    deaconIndex: str | None = None
    taxdump: str | None = None
    diamondDatabase: str | None = None
    taxids: str | None = None

    bleedFraction: float = 0.005
    negativePThreshold: float = 0.01
    minimumHitGroup: int = 4

    runPolishRacon: bool = False
    runPolishMedaka: bool = False
    medakaModel: str | None = None

    runReferenceAssembly: bool = False
    referenceAssemblyMethod: str | None = None
    referenceAssemblySource: str | None = None
    viralGenomes: str | None = None
    viralTaxids: str | None = None
