from models import DataType

class MetagenomicsParameters:
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
    
    def __init__(self, dataType: DataType, sampleSheetFilePath: str, outputDir: str, runName: str, trim: int, threads: int, threadsTotal: int, kraken2DatabasePath: str, kronaDatabasePath: str, removeHumanReads: bool, removeUnclassifiedReads: bool, adaptersPath: str, minimumReadLength: int):
        self.dataType = dataType
        self.sampleSheetFilePath = sampleSheetFilePath
        self.outputDir = outputDir
        self.runName = runName
        self.trim = trim
        self.threads = threads
        self.threadsTotal = threadsTotal
        self.kraken2DatabasePath = kraken2DatabasePath
        self.kronaDatabasePath = kronaDatabasePath
        self.removeHumanReads = removeHumanReads
        self.removeUnclassifiedReads = removeUnclassifiedReads
        self.adaptersPath = adaptersPath
        self.minimumReadLength = minimumReadLength

    def __repr__(self):
        return f"MetagenomicsParameters(dataType={self.dataType}, sampleSheetFilePath={self.sampleSheetFilePath}, outputDir={self.outputDir}, runName={self.runName}, trim={self.trim}, threads={self.threads}, threadsTotal={self.threadsTotal}, kraken2DatabasePath={self.kraken2DatabasePath}, kronaDatabasePath={self.kronaDatabasePath}, removeHumanReads={self.removeHumanReads}, removeUnclassifiedReads={self.removeUnclassifiedReads}, adaptersPath={self.adaptersPath}, minimumReadLength={self.minimumReadLength})"