import logging
import time

from entities.enum import RunState
from entities.run_parameters import RunParameters
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from viralunity.viralunity.viralunity_meta import main as vu_metagenomics
from services.viralunity_domain_logic import FileHashCalculatorService
from config import config

logger = logging.getLogger('uvicorn.error')


class ViralUnityService:
    def __init__(
            self,
            repository: MetagenomicsRunRepository,
            file_hash_calculator: FileHashCalculatorService
        ):
        self.repository = repository

    def main(self):
        logger.info("Starting ViralUnityService main thread...")
        while True:
            try:
                next_task = self.repository.get_pending_run()
                if next_task is None:
                    logger.debug("No task to process, waiting for new tasks...")
                    time.sleep(config.service.polling_interval)
                    continue
                try:
                    metagenomics_parameters = next_task.parameters
                    task_hash = self.file_hash_calculator.get_hash_of_task(next_task.name)
                    if task_hash == next_task.executionHash:
                        logger.debug(f"Task {next_task.id} already processed, marking as COMPLETED.")
                        next_task.state = RunState.COMPLETED
                        self.repository.save_run(next_task)
                        continue
                    params = self.prepare_metagenomics_params(metagenomics_parameters)
                    next_task.state = RunState.RUNNING
                    next_task.iteration += 1
                    next_task.executionHash = task_hash
                    self.repository.save_run(next_task)
                    result = vu_metagenomics(params)
                    logger.debug(f"Metagenomics run completed with result: {result}")
                    next_task.state = RunState.PENDING
                    self.repository.save_run(next_task)
                except Exception as e:
                    next_task.state = RunState.FAILED
                    next_task.errorMessage = str(e)
                    self.repository.save_run(next_task)
                    logger.error(f"Error during metagenomics run: {e}")
            except Exception as e:
                logger.error(f"Error in ViralUnityService main thread: {e}")

    def prepare_metagenomics_params(self, metagenomics_parameters: RunParameters) -> dict:
        return {
            "data_type": metagenomics_parameters.dataType.value,
            "sample_sheet": metagenomics_parameters.sampleSheetFilePath,
            "config_file": metagenomics_parameters.outputDir + "/config.yaml",
            "run_name": f"{metagenomics_parameters.id}_{metagenomics_parameters.runName}",
            "kraken2_database": metagenomics_parameters.kraken2DatabasePath,
            "krona_database": metagenomics_parameters.kronaDatabasePath,
            "adapters": metagenomics_parameters.adaptersPath,
            "threads": metagenomics_parameters.threads,
            "threads_total": metagenomics_parameters.threadsTotal,
            "output": metagenomics_parameters.outputDir,
            "remove_human_reads": metagenomics_parameters.removeHumanReads,
            "remove_unclassified_reads": metagenomics_parameters.removeUnclassifiedReads,
            "create_config_only": False,
            "minimum_read_length": config.service.default_minimum_read_length,
            "trim": metagenomics_parameters.trim,
        } 