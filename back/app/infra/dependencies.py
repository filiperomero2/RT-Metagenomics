from typing import Annotated
from fastapi import Depends
from sqlmodel import Session
from services.metrics_service import MetricsService
from services.paths_service import PathsService
from usecases.get_metagenomics_metrics_usecase import GetMetagenomicsMetricsUseCase
from services.viralunity_service import ViralUnityService
from services.file_hash_calculator_service import FileHashCalculatorService
from services.export_result_service import ExportResultService
from usecases.create_metagenomic_usecase import CreateMetagenomicsRunUseCase
from usecases.list_metagenomic_usecase import ListMetagenomicsUseCase
from usecases.get_metagenomics_result_usecase import GetMetagenomicsResultUseCase
from usecases.export_result_usecase import ExportResultUseCase
from usecases.start_metagenomic_usecase import StartMetagenomicsUseCase
from usecases.stop_metagenomic_usecase import StopMetagenomicsUseCase
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from infra.database.db import get_session
from services.database_setup_service import DatabaseSetupService
from usecases.update_kraken2_db_usecase import UpdateKraken2DbUseCase
from usecases.update_krona_db_usecase import UpdateKronaDbUseCase
from repositories.config_repository import ConfigRepository

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

def get_config_repository(
    db_session: Annotated[Session, Depends(get_db_session)]
) -> ConfigRepository:
    """Get ConfigRepository instance."""
    return ConfigRepository(db_session)

# File hash calculator dependency
def get_file_hash_calculator() -> FileHashCalculatorService:
    """Get FileHashCalculatorService instance."""
    return FileHashCalculatorService()


# Service dependency
def get_paths_service() -> PathsService:
    """Get PathsService instance."""
    return PathsService()

def get_viralunity_service(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)],
    file_hash_calculator: Annotated[FileHashCalculatorService, Depends(get_file_hash_calculator)],
    paths_service: Annotated[PathsService, Depends(get_paths_service)]
) -> ViralUnityService:
    """Get ViralUnity service instance."""
    return ViralUnityService(repository, file_hash_calculator, paths_service)

def get_metrics_service(
    paths_service: Annotated[PathsService, Depends(get_paths_service)]
) -> MetricsService:
    """Get MetricsService instance."""
    return MetricsService(paths_service)

def get_export_result_service() -> ExportResultService:
    """Get ExportResultService instance."""
    return ExportResultService()


# Use case dependencies
def get_create_metagenomics_usecase(
    viralunity_service: Annotated[ViralUnityService, Depends(get_viralunity_service)],
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> CreateMetagenomicsRunUseCase:
    """Get CreateMetagenomicsUseCase instance."""
    return CreateMetagenomicsRunUseCase(viralunity_service, repository)


def get_list_metagenomics_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)],
    metrics_service: Annotated[MetricsService, Depends(get_metrics_service)]
) -> ListMetagenomicsUseCase:
    """Get ListMetagenomicsUseCase instance."""
    return ListMetagenomicsUseCase(repository, metrics_service)


def get_get_metagenomics_result_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)],
    paths_service: Annotated[PathsService, Depends(get_paths_service)]
) -> GetMetagenomicsResultUseCase:
    """Get GetMetagenomicsResultUseCase instance."""
    return GetMetagenomicsResultUseCase(repository, paths_service)


def get_get_metagenomics_metrics_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)],
    metrics_service: Annotated[MetricsService, Depends(get_metrics_service)]
) -> GetMetagenomicsMetricsUseCase:
    """Get GetMetagenomicsMetricsUseCase instance."""
    return GetMetagenomicsMetricsUseCase(repository, metrics_service)


def get_export_result_usecase(
    export_result_service: Annotated[ExportResultService, Depends(get_export_result_service)],
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> ExportResultUseCase:
    """Get ExportResultUseCase instance."""
    return ExportResultUseCase(export_result_service, repository)

def get_start_metagenomics_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> StartMetagenomicsUseCase:
    """Get StartMetagenomicsUseCase instance."""
    return StartMetagenomicsUseCase(repository)

def get_stop_metagenomics_usecase(
    repository: Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)]
) -> StopMetagenomicsUseCase:
    """Get StopMetagenomicsUseCase instance."""
    return StopMetagenomicsUseCase(repository)

def get_database_setup_service(
    config_repository: Annotated[ConfigRepository, Depends(get_config_repository)]
) -> DatabaseSetupService:
    """Get DatabaseSetupService instance."""
    return DatabaseSetupService(config_repository)

def get_update_kraken2_db_usecase(
    database_setup_service: Annotated[DatabaseSetupService, Depends(get_database_setup_service)]
) -> UpdateKraken2DbUseCase:
    """Get UpdateKraken2DbUseCase instance."""
    return UpdateKraken2DbUseCase(database_setup_service)

def get_update_krona_db_usecase(
    database_setup_service: Annotated[DatabaseSetupService, Depends(get_database_setup_service)]
) -> UpdateKronaDbUseCase:
    """Get UpdateKronaDbUseCase instance."""
    return UpdateKronaDbUseCase(database_setup_service)

# Type aliases for cleaner imports
CreateMetagenomicsUseCaseDependency = Annotated[CreateMetagenomicsRunUseCase, Depends(get_create_metagenomics_usecase)]
ListMetagenomicsUseCaseDependency = Annotated[ListMetagenomicsUseCase, Depends(get_list_metagenomics_usecase)]
GetMetagenomicsResultUseCaseDependency = Annotated[GetMetagenomicsResultUseCase, Depends(get_get_metagenomics_result_usecase)]
ViralUnityServiceDependency = Annotated[ViralUnityService, Depends(get_viralunity_service)]
ExportResultServiceDependency = Annotated[ExportResultService, Depends(get_export_result_service)]
MetagenomicsRepositoryDependency = Annotated[MetagenomicsRunRepository, Depends(get_metagenomics_run_repository)] 
GetMetagenomicsMetricsUseCaseDependency = Annotated[GetMetagenomicsMetricsUseCase, Depends(get_get_metagenomics_metrics_usecase)]
ExportResultUseCaseDependency = Annotated[ExportResultUseCase, Depends(get_export_result_usecase)]
StartMetagenomicsUseCaseDependency = Annotated[StartMetagenomicsUseCase, Depends(get_start_metagenomics_usecase)]
StopMetagenomicsUseCaseDependency = Annotated[StopMetagenomicsUseCase, Depends(get_stop_metagenomics_usecase)]
PathsServiceDependency = Annotated[PathsService, Depends(get_paths_service)]
UpdateKraken2DbUseCaseDependency = Annotated[UpdateKraken2DbUseCase, Depends(get_update_kraken2_db_usecase)]
UpdateKronaDbUseCaseDependency = Annotated[UpdateKronaDbUseCase, Depends(get_update_krona_db_usecase)]