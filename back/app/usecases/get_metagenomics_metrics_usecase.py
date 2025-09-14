import logging
from services.metrics_service import MetricsService
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from config import config
import os

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsMetricsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository
        self.metrics_service = MetricsService()

    def execute(self, run_id: int):
        run = self.repository.get_run(run_id)
        summary_file_path = f"{config.output_dir}/{run.id}_{run.name}/metagenomics/metagenomics_summary.txt"
        summary_metrics = self.metrics_service.get_summary_metrics(summary_file_path)
        sample_metrics = {}
        for sample in run.samples:            
            sample_file_path = f"{config.output_dir}/{run.id}_{run.name}/metagenomics/taxonomic_assignments/results/sample-{sample.name}.output.krona.txt"
            sample_metrics[sample.name] = self.metrics_service.get_sample_metrics(sample_file_path)             
                
        return {
            "summary_metrics": summary_metrics,
            "sample_metrics": sample_metrics
        }