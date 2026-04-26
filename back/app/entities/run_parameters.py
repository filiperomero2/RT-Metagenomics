from sqlmodel import Field, SQLModel, Relationship
from entities.enum import DataType
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from entities.run import Run


class RunParameters(SQLModel, table=True):

    id: int | None = Field(default=None, primary_key=True)

    path: str = Field(default=None)

    dataType: DataType = Field(default=DataType.NANOPORE)
    threads: int = Field(default=None)
    threadsTotal: int = Field(default=None)
    kraken2Database: str = Field(default=None)
    kronaDatabase: str = Field(default=None)
    removeHumanReads: bool = Field(default=None)
    removeUnclassifiedReads: bool = Field(default=None)
    minimumReadLength: int = Field(default=None)

    # Illumina fastp / trimming
    adapters: str | None = Field(default=None)
    trimHead: int | None = Field(default=None)
    trimTail: int | None = Field(default=None)

    # Pipeline toggles (ViralUnity ITPS metagenomics)
    runDenovoAssembly: bool = Field(default=False)
    runKraken2Reads: bool = Field(default=True)
    # Contigs classification requires MEGAHIT; keep False when denovo is off (ViralUnity ITPS validator).
    runKraken2Contigs: bool = Field(default=False)
    runDiamondReads: bool = Field(default=False)
    runDiamondContigs: bool = Field(default=False)

    hostReference: str | None = Field(default=None)
    deaconIndex: str | None = Field(default=None)
    taxdump: str | None = Field(default=None)
    diamondDatabase: str | None = Field(default=None)
    taxids: str | None = Field(default=None)

    bleedFraction: float | None = Field(default=0.005)
    negativePThreshold: float | None = Field(default=0.01)
    minimumHitGroup: int | None = Field(default=4)

    # Nanopore polishing (optional)
    runPolishRacon: bool = Field(default=False)
    runPolishMedaka: bool = Field(default=False)
    medakaModel: str | None = Field(default=None)

    # Reference-guided assembly (optional; off by default)
    runReferenceAssembly: bool = Field(default=False)
    referenceAssemblyMethod: str | None = Field(default=None)
    referenceAssemblySource: str | None = Field(default=None)
    viralGenomes: str | None = Field(default=None)
    viralTaxids: str | None = Field(default=None)

    # Relationships
    run: "Run" = Relationship(back_populates="parameters")

    def dict(self):
        return {
            "path": self.path,
            "dataType": self.dataType.value,
            "threads": self.threads,
            "threadsTotal": self.threadsTotal,
            "kraken2Database": self.kraken2Database,
            "kronaDatabase": self.kronaDatabase,
            "removeHumanReads": self.removeHumanReads,
            "removeUnclassifiedReads": self.removeUnclassifiedReads,
            "minimumReadLength": self.minimumReadLength,
            "adapters": self.adapters,
            "trimHead": self.trimHead,
            "trimTail": self.trimTail,
            "runDenovoAssembly": self.runDenovoAssembly,
            "runKraken2Reads": self.runKraken2Reads,
            "runKraken2Contigs": self.runKraken2Contigs,
            "runDiamondReads": self.runDiamondReads,
            "runDiamondContigs": self.runDiamondContigs,
            "hostReference": self.hostReference,
            "deaconIndex": self.deaconIndex,
            "taxdump": self.taxdump,
            "diamondDatabase": self.diamondDatabase,
            "taxids": self.taxids,
            "bleedFraction": self.bleedFraction,
            "negativePThreshold": self.negativePThreshold,
            "minimumHitGroup": self.minimumHitGroup,
            "runPolishRacon": self.runPolishRacon,
            "runPolishMedaka": self.runPolishMedaka,
            "medakaModel": self.medakaModel,
            "runReferenceAssembly": self.runReferenceAssembly,
            "referenceAssemblyMethod": self.referenceAssemblyMethod,
            "referenceAssemblySource": self.referenceAssemblySource,
            "viralGenomes": self.viralGenomes,
            "viralTaxids": self.viralTaxids,
        }

    def __repr__(self):
        return (
            f"RunParameters(dataType={self.dataType}, threads={self.threads}, "
            f"runDenovoAssembly={self.runDenovoAssembly}, runDiamondReads={self.runDiamondReads})"
        )
