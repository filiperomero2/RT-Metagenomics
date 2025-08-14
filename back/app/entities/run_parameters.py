from sqlmodel import Field, SQLModel, Relationship
import csv
from entities.enum import DataType
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from entities.run import Run

class RunParameters(SQLModel, table=True):
    
    id: int | None = Field(default=None, primary_key=True)
    
    dataType: DataType = Field(default=DataType.NANOPORE)
    trim: int = Field(default=None)
    threads: int = Field(default=None)
    threadsTotal: int = Field(default=None)
    kraken2Database: str = Field(default=None)
    kronaDatabase: str = Field(default=None)
    removeHumanReads: bool = Field(default=None)
    removeUnclassifiedReads: bool = Field(default=None)
    minimumReadLength: int = Field(default=None)

    # Relationships
    run: "Run" = Relationship(back_populates="parameters")

    def dict(self):
        return {
            "dataType": self.dataType.value,
            "trim": self.trim,
            "threads": self.threads,
            "threadsTotal": self.threadsTotal,
            "kraken2Database": self.kraken2Database,
            "kronaDatabase": self.kronaDatabase,
            "removeHumanReads": self.removeHumanReads,
            "removeUnclassifiedReads": self.removeUnclassifiedReads,
            "minimumReadLength": self.minimumReadLength
        }

    def __repr__(self):
        return f"RunParameters(dataType={self.dataType}, trim={self.trim}, threads={self.threads}, threadsTotal={self.threadsTotal}, kraken2Database={self.kraken2Database}, kronaDatabase={self.kronaDatabase}, removeHumanReads={self.removeHumanReads}, removeUnclassifiedReads={self.removeUnclassifiedReads}, minimumReadLength={self.minimumReadLength})"