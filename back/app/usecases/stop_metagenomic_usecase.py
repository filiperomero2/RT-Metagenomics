import logging
from entities.enum import RunState
from entities.run import Run
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class StopMetagenomicsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository

    def execute(self, run_id: int):
        run = self.repository.get_run(run_id)
        if run is None:
            logger.error(f"Run with ID {run_id} not found.")
            return None
        run.state = RunState.CANCELLED
        run = self.repository.save_run(run)
        return run