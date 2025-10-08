import logging
import time
import os

from entities.run import Run
from entities.enum import RunState
from entities.run_parameters import RunParameters
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from viralunity.viralunity.viralunity_meta import main as vu_metagenomics
from services.file_hash_calculator_service import FileHashCalculatorService
from config import config

logger = logging.getLogger('uvicorn.error')


class ViralUnityService:
    def __init__(
            self,
            repository: MetagenomicsRunRepository,
            file_hash_calculator: FileHashCalculatorService
        ):
        self.repository = repository
        self.file_hash_calculator = file_hash_calculator

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
                    task_hash = self.file_hash_calculator.get_hash_of_task(next_task)
                    if task_hash == next_task.executionHash:
                        logger.debug(f"Task {next_task.id} already processed, marking as COMPLETED.")
                        next_task.state = RunState.COMPLETED
                        self.repository.save_run(next_task)
                        continue
                    params = self.prepare_metagenomics_params(next_task)
                    next_task.state = RunState.RUNNING
                    next_task.iteration += 1
                    next_task.executionHash = task_hash
                    self.repository.save_run(next_task)
                    
                    before = time.time()
                    result = vu_metagenomics(params)
                    after = time.time()
                    next_task.lastElapsedTimeOfAnalysisExecutionSeconds = after - before
                    next_task.totalElapsedTimeOfAnalysisExecutionSeconds += next_task.lastElapsedTimeOfAnalysisExecutionSeconds
                    
                    logger.debug(f"Metagenomics run completed with result: {result}")
                    if(result == 1):
                        next_task.state = RunState.FAILED
                        next_task.errorMessage = "ViralUnity failed to run"
                    else:
                        next_task.state = RunState.PENDING
                    self.repository.save_run(next_task)
                except Exception as e:
                    next_task.state = RunState.FAILED
                    next_task.errorMessage = str(e)
                    self.repository.save_run(next_task)
                    logger.error(f"Error during metagenomics run: {e}")
            except Exception as e:
                logger.error(f"Error in ViralUnityService main thread: {e}")

    def prepare_metagenomics_params(self, run: Run) -> dict:
        samples = {}
        for sample in run.samples:
            folder_name = config.input_dir + "/" + run.name + "/fastq_pass/" + sample.sampleLib
            if (os.path.exists(folder_name)):
                samples[sample.name] = [folder_name + "/*"]
            else:
                logger.warning(f"Folder {folder_name} does not exist yet, skipping sample {sample.name} for this iteration")
        
        return {
            "data_type": run.parameters.dataType.value,
            "samples": samples,
            "sample_sheet": None,
            "config_file": config.output_dir + "/" + str(run.id)+ "_" + run.name + "/config.yaml",
            "run_name": f"{run.parameters.id}_{run.name}",
            "kraken2_database": run.parameters.kraken2Database,
            "krona_database": run.parameters.kronaDatabase,
            "threads": run.parameters.threads,
            "threads_total": run.parameters.threadsTotal,
            "output": config.output_dir,
            "remove_human_reads": run.parameters.removeHumanReads,
            "remove_unclassified_reads": run.parameters.removeUnclassifiedReads,
            "create_config_only": False,
            "minimum_read_length": config.service.default_minimum_read_length,
            "trim": run.parameters.trim,
        }
