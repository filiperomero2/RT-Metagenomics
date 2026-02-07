import logging
from entities.enum import RunState
from entities.run import Run
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class StartMetagenomicsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository

    def execute(self, run_id: int):
        run = self.repository.get_run(run_id)
        if run is None:
            logger.error(f"Run with ID {run_id} not found.")
            return None
        run.state = RunState.PENDING
        run.executionHash = None
        run = self.repository.save_run(run)
        return run