from typing import Annotated
from fastapi import Depends
from sqlmodel import Session
from usecases.get_metagenomics_metrics_usecase import GetMetagenomicsMetricsUseCase
from services.viralunity_service import ViralUnityService
from services.file_hash_calculator_service import FileHashCalculatorService
from usecases.create_metagenomic_usecase import CreateMetagenomicsRunUseCase
from usecases.list_metagenomic_usecase import ListMetagenomicsUseCase
from usecases.get_metagenomics_result_usecase import GetMetagenomicsResultUseCase
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from infra.database.db import get_session


# Database session dependency
def get_db_session():
    """Get database session."""
    for session in get_session():
        yield session


# Repository dependency
def get_metagenomics_run_repository(
    db_session: Annotated[Session, Depends(get_db_session)]
) -> MetagenomicsRunRepository:
    """Get MetagenomicsRepository instance."""
    return MetagenomicsRunRepository(db_session)

# File hash calculator dependency
def get_file_hash_calculator() -> FileHashCalculatorService:
    """Get FileHashCalculatorService instance."""
    return FileHashCalculatorService()


# Service dependency
def get_viralunity_service(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)],
    file_hash_calculator: Annotated[FileHashCalculatorService, Depends(get_file_hash_calculator)]
) -> ViralUnityService:
    """Get ViralUnity service instance."""
    return ViralUnityService(repository, file_hash_calculator)


# Use case dependencies
def get_create_metagenomics_usecase(
    viralunity_service: Annotated[ViralUnityService, Depends(get_viralunity_service)],
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> CreateMetagenomicsRunUseCase:
    """Get CreateMetagenomicsUseCase instance."""
    return CreateMetagenomicsRunUseCase(viralunity_service, repository)


def get_list_metagenomics_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> ListMetagenomicsUseCase:
    """Get ListMetagenomicsUseCase instance."""
    return ListMetagenomicsUseCase(repository)


def get_get_metagenomics_result_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> GetMetagenomicsResultUseCase:
    """Get GetMetagenomicsResultUseCase instance."""
    return GetMetagenomicsResultUseCase(repository)


def get_get_metagenomics_metrics_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> GetMetagenomicsMetricsUseCase:
    """Get GetMetagenomicsMetricsUseCase instance."""
    return GetMetagenomicsMetricsUseCase(repository)


# Type aliases for cleaner imports
CreateMetagenomicsUseCaseDependency = Annotated[CreateMetagenomicsRunUseCase, Depends(get_create_metagenomics_usecase)]
ListMetagenomicsUseCaseDependency = Annotated[ListMetagenomicsUseCase, Depends(get_list_metagenomics_usecase)]
GetMetagenomicsResultUseCaseDependency = Annotated[GetMetagenomicsResultUseCase, Depends(get_get_metagenomics_result_usecase)]
ViralUnityServiceDependency = Annotated[ViralUnityService, Depends(get_viralunity_service)]
MetagenomicsRepositoryDependency = Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)] 
GetMetagenomicsMetricsUseCaseDependency = Annotated[GetMetagenomicsMetricsUseCase, Depends(get_get_metagenomics_metrics_usecase)]