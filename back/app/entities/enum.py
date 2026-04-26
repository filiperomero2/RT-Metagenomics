from enum import Enum

class DataType(str, Enum):
    ILLUMINA = "illumina"
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
    POLLING_INTERVAL = "polling_interval"
    ITERATION_INTERVAL = "iteration_interval"
    DIAMOND_TAXDUMP = "diamond_taxdump"
    DIAMOND_TAXIDS = "diamond_taxids"
