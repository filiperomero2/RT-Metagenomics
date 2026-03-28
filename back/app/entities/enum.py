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
    KRONA_PATH = "krona_path"
    KRAKEN2_PATH = "kraken2_path"
    POLLING_INTERVAL = "polling_interval"
    ITERATION_INTERVAL = "iteration_interval"
    DIAMOND_TAXDUMP_PATH = "diamond_taxdump_path"
    DIAMOND_ASSEMBLY_SUMMARY_PATH = "diamond_assembly_summary_path"
    DIAMOND_TAXID_TO_FAMILY_PATH = "diamond_taxid_to_family_path"
