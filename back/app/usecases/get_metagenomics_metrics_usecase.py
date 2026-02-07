import logging
from services.metrics_service import MetricsService
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from config import config
import os

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsMetricsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository, metrics_service: MetricsService):
        self.repository = repository
        self.metrics_service = metrics_service

    def execute(self, run_id: int):
        run = self.repository.get_run(run_id)
        
        if run is None:
            logger.error(f"Run with ID {run_id} not found.")
            return None
        
        sample_metrics = {}
        for sample in run.samples:            
            sample_metrics[sample.name] = self.metrics_service.get_sample_metrics(run, sample.name)             
        
        summary_metrics = self.metrics_service.get_summary_metrics(run)
            
        return {
            "summaryMetrics": summary_metrics,
            "sampleMetrics": sample_metrics,
        }