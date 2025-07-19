from typing import Annotated
from fastapi import Depends
from sqlmodel import Session
from services.viralunity_service import ViralUnityService
from services.viralunity_domain_logic import ViralUnityDomainLogic
from usecases.create_metagenomic_usecase import CreateMetagenomicsUseCase
from usecases.list_metagenomic_usecase import ListMetagenomicsUseCase
from usecases.get_metagenomics_result_usecase import GetMetagenomicsResultUseCase
from repositories.metagenomics_repository import MetagenomicsRepository
from infra.database.db import get_session


# Database session dependency
def get_db_session():
    """Get database session."""
    for session in get_session():
        yield session


# Repository dependency
def get_metagenomics_repository(
    db_session: Annotated[Session, Depends(get_db_session)]
) -> MetagenomicsRepository:
    """Get MetagenomicsRepository instance."""
    return MetagenomicsRepository(db_session)


# Domain logic dependency
def get_viralunity_domain_logic() -> ViralUnityDomainLogic:
    """Get ViralUnity domain logic instance."""
    return ViralUnityDomainLogic()


# Service dependency
def get_viralunity_service(
    domain_logic: Annotated[ViralUnityDomainLogic, Depends(get_viralunity_domain_logic)]
) -> ViralUnityService:
    """Get ViralUnity service instance."""
    return ViralUnityService(domain_logic)


# Use case dependencies
def get_create_metagenomics_usecase(
    db_session: Annotated[Session, Depends(get_db_session)],
    viralunity_service: Annotated[ViralUnityService, Depends(get_viralunity_service)]
) -> CreateMetagenomicsUseCase:
    """Get CreateMetagenomicsUseCase instance."""
    return CreateMetagenomicsUseCase(viralunity_service, db_session)


def get_list_metagenomics_usecase(
    db_session: Annotated[Session, Depends(get_db_session)]
) -> ListMetagenomicsUseCase:
    """Get ListMetagenomicsUseCase instance."""
    return ListMetagenomicsUseCase(db_session)


def get_get_metagenomics_result_usecase(
    db_session: Annotated[Session, Depends(get_db_session)]
) -> GetMetagenomicsResultUseCase:
    """Get GetMetagenomicsResultUseCase instance."""
    return GetMetagenomicsResultUseCase(db_session)


# Type aliases for cleaner imports
CreateMetagenomicsUseCaseDependency = Annotated[CreateMetagenomicsUseCase, Depends(get_create_metagenomics_usecase)]
ListMetagenomicsUseCaseDependency = Annotated[ListMetagenomicsUseCase, Depends(get_list_metagenomics_usecase)]
GetMetagenomicsResultUseCaseDependency = Annotated[GetMetagenomicsResultUseCase, Depends(get_get_metagenomics_result_usecase)]
ViralUnityServiceDependency = Annotated[ViralUnityService, Depends(get_viralunity_service)]
MetagenomicsRepositoryDependency = Annotated[MetagenomicsRepository, Depends(get_metagenomics_repository)] 