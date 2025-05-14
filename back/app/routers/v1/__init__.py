from fastapi import APIRouter, Depends
from services import ViralUnityService
from schemas import MetagenomicsParametersSchema
from usecases import StartMetagenomicsUseCase

router = APIRouter(prefix='/v1')

def get_viralunity_service():
    return ViralUnityService()

def get_start_metagenomics_usecase(viralunity_service=Depends(get_viralunity_service)):
    return StartMetagenomicsUseCase(viralunity_service)

@router.post("/metagenomics")
async def start_metagenomics(
    metagenomics_parameters: MetagenomicsParametersSchema,
    usecase: StartMetagenomicsUseCase = Depends(get_start_metagenomics_usecase)
):
    return usecase.execute(metagenomics_parameters)