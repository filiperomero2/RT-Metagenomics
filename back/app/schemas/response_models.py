from typing import List, Optional
from datetime import datetime
from entities.enum import RunState, DataType

# Base response models
class ErrorResponse:
    def __init__(self, success: bool, message: str = "Success"):
        self.success = success
        self.message = message

# Metagenomics Run Response Models
class MetagenomicsRunResponse:
    def __init__(
        self,
        id: int,
        parameters_id: int,
        state: RunState,
        error_message: Optional[str] = None,
        execution_hash: Optional[str] = None,
        iteration: int = 1,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None
    ):
        self.id = id
        self.parameters_id = parameters_id
        self.state = state
        self.error_message = error_message
        self.execution_hash = execution_hash
        self.iteration = iteration
        self.created_at = created_at
        self.updated_at = updated_at

    def dict(self):
        return {
            "id": self.id,
            "parameters_id": self.parameters_id,
            "state": self.state.value if hasattr(self.state, 'value') else str(self.state),
            "error_message": self.error_message,
            "execution_hash": self.execution_hash,
            "iteration": self.iteration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

# Metagenomics Parameters Response Model
class MetagenomicsParametersResponse:
    def __init__(
        self,
        id: int,
        data_type: DataType,
        sample_sheet_file_path: str,
        output_dir: str,
        run_name: str,
        trim: int,
        threads: int,
        threads_total: int,
        kraken2_database_path: str,
        krona_database_path: str,
        remove_human_reads: bool,
        remove_unclassified_reads: bool,
        adapters_path: str,
        minimum_read_length: int
    ):
        self.id = id
        self.data_type = data_type
        self.sample_sheet_file_path = sample_sheet_file_path
        self.output_dir = output_dir
        self.run_name = run_name
        self.trim = trim
        self.threads = threads
        self.threads_total = threads_total
        self.kraken2_database_path = kraken2_database_path
        self.krona_database_path = krona_database_path
        self.remove_human_reads = remove_human_reads
        self.remove_unclassified_reads = remove_unclassified_reads
        self.adapters_path = adapters_path
        self.minimum_read_length = minimum_read_length

    def dict(self):
        return {
            "id": self.id,
            "data_type": self.data_type.value if hasattr(self.data_type, 'value') else str(self.data_type),
            "sample_sheet_file_path": self.sample_sheet_file_path,
            "output_dir": self.output_dir,
            "run_name": self.run_name,
            "trim": self.trim,
            "threads": self.threads,
            "threads_total": self.threads_total,
            "kraken2_database_path": self.kraken2_database_path,
            "krona_database_path": self.krona_database_path,
            "remove_human_reads": self.remove_human_reads,
            "remove_unclassified_reads": self.remove_unclassified_reads,
            "adapters_path": self.adapters_path,
            "minimum_read_length": self.minimum_read_length
        }

# Complete Metagenomics Run with Parameters
class MetagenomicsRunWithParametersResponse:
    def __init__(
        self,
        run: MetagenomicsRunResponse,
        parameters: MetagenomicsParametersResponse
    ):
        self.run = run
        self.parameters = parameters

    def dict(self):
        return {
            "run": self.run.dict(),
            "parameters": self.parameters.dict()
        }

# Success Response Models
class CreateMetagenomicsResponse:
    def __init__(self, run: MetagenomicsRunResponse):
        self.run = run

    def dict(self):
        return self.run.dict()

class ListMetagenomicsResponse:
    def __init__(self, data:  List[MetagenomicsRunWithParametersResponse]):
        self.data = data

    def dict(self):
        return [ run.dict() for run in self.data]

class HealthCheckResponse:
    def __init__(self, status: str = "UP", timestamp: Optional[datetime] = None):
        self.status = status
        self.timestamp = timestamp or datetime.now()

    def dict(self):
        return {
            "status": self.status,
            "timestamp": self.timestamp.isoformat()
        } 