from sqlmodel import Field, SQLModel, Relationship
import csv
from entities.enum import DataType
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from entities.run import Run

class RunParameters(SQLModel, table=True):
    
    id: int | None = Field(default=None, primary_key=True)
    
    dataType: DataType = Field(default=DataType.NANOPORE)
    sampleSheetFilePath: str = Field(default=None)
    outputDir: str = Field(default=None)
    runName: str = Field(default=None)
    trim: int = Field(default=None)
    threads: int = Field(default=None)
    threadsTotal: int = Field(default=None)
    kraken2DatabasePath: str = Field(default=None)
    kronaDatabasePath: str = Field(default=None)
    removeHumanReads: bool = Field(default=None)
    removeUnclassifiedReads: bool = Field(default=None)
    adaptersPath: str = Field(default=None)
    minimumReadLength: int = Field(default=None)

    # Relationships
    run: "Run" = Relationship(back_populates="parameters")

    def __repr__(self):
        return f"RunParameters(dataType={self.dataType}, sampleSheetFilePath={self.sampleSheetFilePath}, outputDir={self.outputDir}, runName={self.runName}, trim={self.trim}, threads={self.threads}, threadsTotal={self.threadsTotal}, kraken2DatabasePath={self.kraken2DatabasePath}, kronaDatabasePath={self.kronaDatabasePath}, removeHumanReads={self.removeHumanReads}, removeUnclassifiedReads={self.removeUnclassifiedReads}, adaptersPath={self.adaptersPath}, minimumReadLength={self.minimumReadLength})"