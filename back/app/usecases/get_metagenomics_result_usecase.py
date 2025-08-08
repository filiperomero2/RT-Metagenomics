import logging
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from config import config

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsResultUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository

    def execute(self, run_id: int, sample_id: str):
        run = self.repository.get_run(run_id)
        sample = next(x for x in run.samples if x.id == sample_id)
        if sample is not None:
            parameters = run.parameters
            with open(f"{config.output_dir}/{run.id}_{run.name}/metagenomics/taxonomic_assignments/reports/{sample.name}.output.krona.html", "r") as krona_plot:
                yield from krona_plot