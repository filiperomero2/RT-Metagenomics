from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from entities.run_parameters import RunParameters
from schemas import MetagenomicsParametersSchema
from schemas.response_models import (
    CreateMetagenomicsResponse,
    ListMetagenomicsResponse,
    HealthCheckResponse
)
from infra.dependencies import (
    CreateMetagenomicsUseCaseDependency,
    ListMetagenomicsUseCaseDependency,
    GetMetagenomicsResultUseCaseDependency
)

router = APIRouter(prefix='/v1')

@router.post("/metagenomics", response_model=dict)
async def start_metagenomics(
    metagenomics_parameters: MetagenomicsParametersSchema,
    usecase: CreateMetagenomicsUseCaseDependency
):
    """
    Start a new metagenomics analysis run.
    
    Args:
        metagenomics_parameters: The parameters for the metagenomics analysis
        
    Returns:
        CreateMetagenomicsResponse: The created metagenomics run with success status
    """
    run = usecase.execute(RunParameters(
        dataType=metagenomics_parameters.dataType,
        sampleSheetFilePath=metagenomics_parameters.sampleSheetFilePath,
        runName=metagenomics_parameters.runName,
        kraken2DatabasePath=metagenomics_parameters.kraken2DatabasePath,
        kronaDatabasePath=metagenomics_parameters.kronaDatabasePath,
        adaptersPath=metagenomics_parameters.adaptersPath,
        threads=metagenomics_parameters.threads,
        threadsTotal=metagenomics_parameters.threadsTotal,
        removeHumanReads=metagenomics_parameters.removeHumanReads,
        removeUnclassifiedReads=metagenomics_parameters.removeUnclassifiedReads,
        trim=metagenomics_parameters.trim,
        minimumReadLength=metagenomics_parameters.minimumReadLength,
        outputDir=metagenomics_parameters.outputDir
    ))
    
    # Convert to response model
    run_response = CreateMetagenomicsResponse(
        run=run
    )
    return run_response.dict()
    
@router.get("/metagenomics", response_model=dict)
async def get_metagenomics(usecase: ListMetagenomicsUseCaseDependency):
    """
    Get a list of all metagenomics runs.
    
    Returns:
        ListMetagenomicsResponse: List of metagenomics runs with metadata
    """
    runs_data = list(usecase.execute())
    
    # Convert to response model - return the raw data for now
    # since the frontend expects a simple array
    return ListMetagenomicsResponse(data=runs_data)

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

@router.get("/health", response_model=dict)
async def health_check():
    """
    Health check endpoint to verify API status.
    
    Returns:
        HealthCheckResponse: API status and timestamp
    """
    health_response = HealthCheckResponse()
    return health_response.dict()