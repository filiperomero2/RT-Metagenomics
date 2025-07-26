from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from dto.health_check_response import HealthCheckResponse
from usecases.create_metagenomic_usecase import CreateMetagenomicsRunInput
from dto import CreateMetagenomicsRunRequest
from infra.dependencies import (
    CreateMetagenomicsUseCaseDependency,
    ListMetagenomicsUseCaseDependency,
    GetMetagenomicsResultUseCaseDependency
)

router = APIRouter(prefix='/v1')

@router.post("/metagenomics/run", response_model=dict)
async def start_metagenomics(
    metagenomics_run: CreateMetagenomicsRunRequest,
    usecase: CreateMetagenomicsUseCaseDependency
):
    """
    Start a new metagenomics analysis run.
    
    Args:
        metagenomics_parameters: The parameters for the metagenomics analysis
        
    Returns:
        CreateMetagenomicsResponse: The created metagenomics run with success status
    """
    run = usecase.execute(CreateMetagenomicsRunInput(
        dataType=metagenomics_run.dataType,
        samples=metagenomics_run.samples,
        runName=metagenomics_run.runName,
        trim=metagenomics_run.trim,
        threads=metagenomics_run.threads,
        threadsTotal=metagenomics_run.threadsTotal,
        removeHumanReads=metagenomics_run.removeHumanReads,
        removeUnclassifiedReads=metagenomics_run.removeUnclassifiedReads,
        minimumReadLength=metagenomics_run.minimumReadLength,
        kraken2Database=metagenomics_run.kraken2Database,
        kronaDatabase=metagenomics_run.kronaDatabase,
    ))
    
    return run.dict()
    
@router.get("/metagenomics")
async def get_metagenomics(usecase: ListMetagenomicsUseCaseDependency):
    """
    Get a list of all metagenomics runs.
    
    Returns:
        ListMetagenomicsResponse: List of metagenomics runs with metadata
    """
    runs_data = usecase.execute()
    
    # Convert to response model - return the raw data for now
    # since the frontend expects a simple array
    return [run.dict() for run in runs_data]

@router.get("/metagenomics/{run_id}/result")
async def get_metagenomics_result(run_id: int, usecase: GetMetagenomicsResultUseCaseDependency):
    """
    Get the results of a specific metagenomics run.
    
    Args:
        run_id: The ID of the metagenomics run
        
    Returns:
        StreamingResponse: HTML report of the metagenomics results
    """
    return StreamingResponse(usecase.execute(run_id), media_type="text/html")

@router.get("/health")
async def health_check():
    """
    Health check endpoint to verify API status.
    
    Returns:
        HealthCheckResponse: API status and timestamp
    """
    health_response = HealthCheckResponse()
    return health_response.dict()