from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from usecases.get_metagenomics_result_usecase import GetMetagenomicsResultUseCaseDependency
from usecases.list_metagenomic_usecase import ListMetagenomicsUseCaseDependency
from entities.metagenomics_parameters import MetagenomicsParameters
from usecases.start_metagenomic_usecase import StartMetagenomicsUseCaseDependency
from schemas import MetagenomicsParametersSchema

router = APIRouter(prefix='/v1')

@router.post("/metagenomics")
async def start_metagenomics(
    metagenomics_parameters: MetagenomicsParametersSchema,
    usecase: StartMetagenomicsUseCaseDependency
):
    return usecase.execute(MetagenomicsParameters(
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
    
@router.get("/metagenomics")
async def get_metagenomics(usecase: ListMetagenomicsUseCaseDependency):
    return usecase.execute()

@router.get("/metagenomics/{run_id}/result")
async def get_metagenomics_result(run_id: int, usecase: GetMetagenomicsResultUseCaseDependency):
    return StreamingResponse(usecase.execute(run_id), media_type="text/html")