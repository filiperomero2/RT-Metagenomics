import logging
from repositories.metagenomics_repository import MetagenomicsRepository

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsResultUseCase:
    def __init__(self, repository: MetagenomicsRepository):
        self.repository = repository

    def execute(self, run_id: int):
        result = self.repository.get_run_with_parameters(run_id)
        if result is not None:
            run, parameters = result 
            with open(f"{parameters.outputDir}/{parameters.id}_{parameters.runName}/metagenomics/taxonomic_assignments/reports/sample-4117.output.krona.html", "r") as krona_plot:
                yield from krona_plot