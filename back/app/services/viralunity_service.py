import logging
import time
import os
import datetime

from services.paths_service import PathsService
from services.taxids_utils import resolve_taxids_path
from entities.run import Run
from entities.enum import RunState
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from viralunity.viralunity_meta import main as vu_metagenomics
from services.file_hash_calculator_service import FileHashCalculatorService
from config import config

logger = logging.getLogger('uvicorn.error')


class ViralUnityService:
    def __init__(
            self,
            repository: MetagenomicsRunRepository,
            file_hash_calculator: FileHashCalculatorService,
            paths_service: PathsService
        ):
        self.repository = repository
        self.file_hash_calculator = file_hash_calculator
        self.paths_service = paths_service

    def main(self):
        logger.info("Starting ViralUnityService main thread...")
        while True:
            try:
                next_task = self.repository.get_pending_run()
                if next_task is None:
                    time.sleep(config.service.polling_interval)
                    continue
                try:
                    task_hash = self.file_hash_calculator.get_hash_of_task(next_task.parameters)
                    task_hash_time = datetime.datetime.now()
                    if task_hash == next_task.executionHash:
                        logger.debug(f"No change since last check for Task {next_task.id}. Re-queueing...")
                        next_task.state = RunState.PENDING
                        self.repository.save_run(next_task)
                        continue
                    params = self.prepare_metagenomics_params(next_task)
                    logger.debug(f"Params: {params}")
                    next_task.state = RunState.RUNNING
                    next_task.iteration += 1
                    next_task.executionHash = task_hash
                    next_task.executionHashTime = task_hash_time
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
                    logger.error(f"Error during metagenomics run: {e}")
                    next_task.state = RunState.FAILED
                    next_task.errorMessage = str(e)
                    self.repository.save_run(next_task)
            except Exception as e:
                logger.error(f"Error in ViralUnityService main thread: {e}")

    def prepare_metagenomics_params(self, run: Run) -> dict:
        samples = {}
        for sample in run.samples:
            folder_name = run.parameters.path + "/" + sample.sampleLib
            if (os.path.exists(folder_name)):
                samples[sample.name] = [folder_name + "/*"]
            else:
                logger.warning(f"Folder {folder_name} does not exist yet, skipping sample {sample.name} for this iteration")
        
        base_output_path = self.paths_service.get_output_path(run)
        trim_value = run.parameters.trim if run.parameters.trim is not None else 0
        minimum_read_length = (
            run.parameters.minimumReadLength
            if run.parameters.minimumReadLength is not None
            else config.service.default_minimum_read_length
        )
        resolved_taxids = resolve_taxids_path(
            run.parameters.diamondDatabase,
            run.parameters.taxids,
        )

        run_denovo = bool(run.parameters.runDenovoAssembly)

        params = {
            "data_type": run.parameters.dataType.value,
            "samples": samples,
            "sample_sheet": None,
            "config_file": self.paths_service.get_config_path(run),
            "run_name": f"{run.parameters.id}_{run.name}",
            "kraken2_database": run.parameters.kraken2Database,
            "krona_database": run.parameters.kronaDatabase,
            "threads": run.parameters.threads,
            "threads_total": run.parameters.threadsTotal,
            "output": base_output_path,
            "remove_human_reads": run.parameters.removeHumanReads,
            "remove_unclassified_reads": run.parameters.removeUnclassifiedReads,
            "create_config_only": False,
            "minimum_read_length": minimum_read_length,
            "trim_head": trim_value,
            "trim_tail": trim_value,
            "taxdump": run.parameters.taxdump,
            "run_kraken2_reads": True,
            "run_kraken2_contigs": run_denovo,
            "run_diamond_reads": run.parameters.runDiamondReads,
            "run_diamond_contigs": run.parameters.runDiamondContigs,
            "run_denovo_assembly": run_denovo,
        }

        if run.parameters.runDiamondReads or run.parameters.runDiamondContigs:
            params["diamond_database"] = run.parameters.diamondDatabase
            if resolved_taxids:
                params["taxids"] = resolved_taxids

        return params
