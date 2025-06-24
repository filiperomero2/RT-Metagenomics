import logging
from typing import Annotated


from fastapi import Depends
from services.viralunity_service import ViralUnityServiceDependency
from infra.database.db import DbSession
from entities.metagenomics_parameters import MetagenomicsParameters

logger  = logging.getLogger('uvicorn.error')
class CreateMetagenomicsUseCase:
    def __init__(self, viralunity_service, database_session: DbSession):
        self.viralunity_service = viralunity_service
        self.database_session = database_session

    def execute(self, metagenomics_parameters: MetagenomicsParameters):
        logger.debug(f"Starting metagenomics with parameters: {metagenomics_parameters}")
        
        try:
            logger.debug(f"Calling viralunity service to start metagenomics with parameters: {metagenomics_parameters}")
            run = self.viralunity_service.enqueue_metagenomics(metagenomics_parameters)
            return run
        except Exception as e:
            raise e
    
    
def get_create_metagenomics_usecase( database_session: DbSession, viralunity_service: ViralUnityServiceDependency):
    return CreateMetagenomicsUseCase(viralunity_service, database_session)

CreateMetagenomicsUseCaseDependency = Annotated[CreateMetagenomicsUseCase, Depends(get_create_metagenomics_usecase)]