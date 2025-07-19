import logging
from entities.run_parameters import RunParameters
from repositories.metagenomics_repository import MetagenomicsRepository
from services.viralunity_service import ViralUnityService
from exceptions import TaskExecutionError

logger = logging.getLogger('uvicorn.error')

class CreateMetagenomicsUseCase:
    def __init__(self, viralunity_service: ViralUnityService, repository: MetagenomicsRepository):
        self.viralunity_service = viralunity_service
        self.repository = repository

    def execute(self, metagenomics_parameters: RunParameters):
        logger.debug(f"Starting metagenomics with parameters: {metagenomics_parameters}")
        
        try:
            logger.debug(f"Calling viralunity service to start metagenomics with parameters: {metagenomics_parameters}")
            run = self.viralunity_service.enqueue_metagenomics(metagenomics_parameters)
            return run
        except Exception as e:
            logger.error(f"Failed to start metagenomics: {e}")
            raise TaskExecutionError(f"Failed to start metagenomics: {e}", "TASK_START_FAILED")