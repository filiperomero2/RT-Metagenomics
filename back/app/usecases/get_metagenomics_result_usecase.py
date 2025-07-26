import logging
from repositories.metagenomics_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsResultUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository

    def execute(self, run_id: int, sample_name: str):
        result = self.repository.get_run(run_id, sample_name)
        if result is not None:
            run, parameters, sample = result 
            with open(f"{parameters.outputDir}/{parameters.id}_{parameters.runName}/metagenomics/taxonomic_assignments/reports/sample-4117.output.krona.html", "r") as krona_plot:
                yield from krona_plot