import logging
from repositories.metagenomics_repository import MetagenomicsRepository

logger = logging.getLogger('uvicorn.error')

class ListMetagenomicsUseCase:
    def __init__(self, repository: MetagenomicsRepository):
        self.repository = repository

    def execute(self):
        results = self.repository.get_all_runs_with_parameters()
        for run, parameters in results:
            yield {
                "id": run.id,
                "state": run.state.value,
                "iteration": run.iteration,
                "parameters": {
                    "dataType": parameters.dataType.value,
                    "sampleSheetFilePath": parameters.sampleSheetFilePath,
                    "runName": parameters.runName,
                    "kraken2DatabasePath": parameters.kraken2DatabasePath,
                    "kronaDatabasePath": parameters.kronaDatabasePath,
                    "adaptersPath": parameters.adaptersPath,
                    "threads": parameters.threads,
                    "threadsTotal": parameters.threadsTotal,
                    "removeHumanReads": parameters.removeHumanReads,
                    "removeUnclassifiedReads": parameters.removeUnclassifiedReads,
                    "trim": parameters.trim,
                    "minimumReadLength": parameters.minimumReadLength,
                    "outputDir": parameters.outputDir
                }
            }