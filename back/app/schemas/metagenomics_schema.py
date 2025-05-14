from models import DataType
from pydantic import BaseModel

class MetagenomicsParametersSchema(BaseModel):
    dataType: DataType
    sampleSheetFilePath: str
    outputDir: str
    runName: str
    trim: int
    threads: int
    threadsTotal: int
    kraken2DatabasePath: str
    kronaDatabasePath: str
    removeHumanReads: bool
    removeUnclassifiedReads: bool
    adaptersPath: str
    minimumReadLength: int