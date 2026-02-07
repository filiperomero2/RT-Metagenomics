import logging
from typing import List
from services.metrics_service import MetricsService
from entities.run import Run
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class RunResult(dict):
    def __init__(self, run: Run, metrics: dict = {}):
        super().__init__(**run.dict())
        self["metrics"] = metrics

class ListMetagenomicsUseCase:
    def __init__(self, repository: MetagenomicsRunRepository, metrics_service: MetricsService):
        self.repository = repository
        self.metrics_service = metrics_service

    def execute(self) -> List[RunResult]:
        results = self.repository.get_all_runs()

        run_results = []
        for result in results:
            run_metrics =  self.metrics_service.get_summary_metrics(result)
            run_results.append(RunResult(result, run_metrics))
        return run_results