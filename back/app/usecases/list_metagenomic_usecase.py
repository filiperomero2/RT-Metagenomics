import logging
from typing import List
from entities.run import Run
from entities.run_parameters import RunParameters
from entities.sample import Sample
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class ListMetagenomicsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository

    def execute(self) -> List[Run]:
        results = self.repository.get_all_runs()

        return results