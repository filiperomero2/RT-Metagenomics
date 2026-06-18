from sqlmodel import Field, SQLModel, Relationship
from entities.enum import DataType
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from entities.run import Run

class RunParameters(SQLModel, table=True):
    
    id: int | None = Field(default=None, primary_key=True)
    
    path: str = Field(default=None)

    dataType: DataType = Field(default=DataType.NANOPORE)
    trim: int = Field(default=None)
    threads: int = Field(default=None)
    threadsTotal: int = Field(default=None)
    kraken2Database: str = Field(default=None)
    kronaDatabase: str = Field(default=None)
    removeHumanReads: bool = Field(default=None)
    removeUnclassifiedReads: bool = Field(default=None)
    minimumReadLength: int = Field(default=None)
    diamondDatabase: str | None = Field(default=None)
    taxdump: str | None = Field(default=None)
    taxids: str | None = Field(default=None)
    runDiamondReads: bool = Field(default=False)
    runDiamondContigs: bool = Field(default=False)
    runDenovoAssembly: bool = Field(default=False)

    # Relationships
    run: "Run" = Relationship(back_populates="parameters")

    def dict(self):
        return {
            "path": self.path,
            "dataType": self.dataType.value,
            "trim": self.trim,
            "threads": self.threads,
            "threadsTotal": self.threadsTotal,
            "kraken2Database": self.kraken2Database,
            "kronaDatabase": self.kronaDatabase,
            "removeHumanReads": self.removeHumanReads,
            "removeUnclassifiedReads": self.removeUnclassifiedReads,
            "minimumReadLength": self.minimumReadLength,
            "diamondDatabase": self.diamondDatabase,
            "taxdump": self.taxdump,
            "taxids": self.taxids,
            "runDiamondReads": self.runDiamondReads,
            "runDiamondContigs": self.runDiamondContigs,
            "runDenovoAssembly": self.runDenovoAssembly,
        }

    def __repr__(self):
        return (
            f"RunParameters(dataType={self.dataType}, trim={self.trim}, "
            f"threads={self.threads}, threadsTotal={self.threadsTotal}, "
            f"kraken2Database={self.kraken2Database}, kronaDatabase={self.kronaDatabase}, "
            f"removeHumanReads={self.removeHumanReads}, "
            f"removeUnclassifiedReads={self.removeUnclassifiedReads}, "
            f"minimumReadLength={self.minimumReadLength}, "
            f"diamondDatabase={self.diamondDatabase}, taxdump={self.taxdump}, "
            f"taxids={self.taxids}, runDiamondReads={self.runDiamondReads}, "
            f"runDiamondContigs={self.runDiamondContigs}, "
            f"runDenovoAssembly={self.runDenovoAssembly})"
        )
