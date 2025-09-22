import logging
from services.charts_service import ChartsService
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsChartsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository
        self.charts_service = ChartsService()

    def execute(self, run_id: int):
        run = self.repository.get_run(run_id)

        viralDatasets = self.charts_service.get_viral_datasets(run.samples)
        familyDatasets = self.charts_service.get_family_datasets(run.samples)
        
        return {
            "viralDatasets": viralDatasets,
            "familyDatasets": familyDatasets
        }