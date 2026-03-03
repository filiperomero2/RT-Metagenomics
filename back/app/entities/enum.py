from enum import Enum

class DataType(str, Enum):
    NANOPORE = "nanopore"
    
class RunState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ConfigType(str, Enum):
    KRAKEN2 = "kraken2_database"
    KRONA = "krona_database"