import logging
from sqlmodel import select
from entities.metagenomics_parameters import MetagenomicsParameters
from entities.metagenomic_run import MetagenomicRun

logger = logging.getLogger('uvicorn.error')

class ListMetagenomicsUseCase:
    def __init__(self, database_session):
        self.database_session = database_session

    def execute(self):
        stmt = select(MetagenomicRun, MetagenomicsParameters).where(MetagenomicRun.parametersId == MetagenomicsParameters.id)
        results = self.database_session.exec(stmt)
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