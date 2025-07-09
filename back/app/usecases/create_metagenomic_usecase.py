import logging
from entities.metagenomics_parameters import MetagenomicsParameters
from exceptions import TaskExecutionError

logger = logging.getLogger('uvicorn.error')

class CreateMetagenomicsUseCase:
    def __init__(self, viralunity_service, database_session):
        self.viralunity_service = viralunity_service
        self.database_session = database_session

    def execute(self, metagenomics_parameters: MetagenomicsParameters):
        logger.debug(f"Starting metagenomics with parameters: {metagenomics_parameters}")
        
        try:
            logger.debug(f"Calling viralunity service to start metagenomics with parameters: {metagenomics_parameters}")
            run = self.viralunity_service.enqueue_metagenomics(metagenomics_parameters)
            return run
        except Exception as e:
            logger.error(f"Failed to start metagenomics: {e}")
            raise TaskExecutionError(f"Failed to start metagenomics: {e}", "TASK_START_FAILED")