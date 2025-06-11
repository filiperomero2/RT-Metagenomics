import logging
from typing import Annotated


from fastapi import Depends
from sqlmodel import select
from entities.metagenomics_parameters import MetagenomicsParameters
from entities.metagenomic_run import MetagenomicRun
from infra.database.db import DbSession

logger  = logging.getLogger('uvicorn.error')
class GetMetagenomicsResultUseCase:
    def __init__(self, database_session: DbSession):
        self.database_session = database_session

    def execute(self, run_id: int):
        stmt = select(MetagenomicRun, MetagenomicsParameters).join(MetagenomicsParameters).where(MetagenomicRun.id == run_id)
        results = self.database_session.exec(stmt)
        data = results.first()
        if (data is not None):
            run, parameters = data 
            with open(f"{parameters.outputDir}/{parameters.id}_{parameters.runName}/metagenomics/taxonomic_assignments/reports/sample-4117.output.krona.html", "r") as krona_plot:
                yield from krona_plot

    
def get_get_metagenomics_result_usecase(database_session: DbSession):
    return GetMetagenomicsResultUseCase(database_session)

GetMetagenomicsResultUseCaseDependency = Annotated[GetMetagenomicsResultUseCase, Depends(get_get_metagenomics_result_usecase)]