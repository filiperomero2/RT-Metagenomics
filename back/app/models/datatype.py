from enum import Enum

class DataType(str, Enum):
    ILLUMINA = "illumina"
    NANOPORE = "nanopore"