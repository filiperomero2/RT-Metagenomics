import logging
import os
import hashlib
import csv
import time

from entities.enum import RunState
from entities.run import Run
from entities.run_parameters import RunParameters
from repositories.metagenomics_repository import MetagenomicsRepository
from viralunity.viralunity.viralunity_meta import main as metagenomics
from services.viralunity_domain_logic import ViralUnityDomainLogic
from config import config

logger = logging.getLogger('uvicorn.error')


class ViralUnityService:
    def __init__(self, domain_logic: ViralUnityDomainLogic, repository: MetagenomicsRepository):
        self.domain_logic = domain_logic
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
                    metagenomics_parameters = self.repository.get_run_parameters_by_id(next_task.parametersId)
                    task_hash = self.domain_logic.get_hash_of_task(metagenomics_parameters)
                    if task_hash == next_task.executionHash:
                        logger.debug(f"Task {next_task.id} already processed, marking as COMPLETED.")
                        next_task.state = RunState.COMPLETED
                        self.repository.save_run(next_task)
                        continue
                    if metagenomics_parameters is None:
                        logger.error(f"Parameters for run {next_task.id} not found.")
                        next_task.state = RunState.FAILED
                        self.repository.save_run(next_task)
                        continue
                    params = self.domain_logic.prepare_metagenomics_params(metagenomics_parameters)
                    next_task.state = RunState.RUNNING
                    next_task.iteration += 1
                    next_task.executionHash = task_hash
                    self.repository.save_run(next_task)
                    result = metagenomics(params)
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
    
    def enqueue_metagenomics(self, metagenomics_parameters: RunParameters):        
        try:
            # Save parameters first
            saved_parameters = self.repository.save_run_parameters(metagenomics_parameters)
            
            # Create and save run
            run = Run(state=RunState.PENDING, iteration=0, parametersId=saved_parameters.id)
            saved_run = self.repository.save_run(run)
            return saved_run
        except Exception as e:
            logger.error(f"Error starting metagenomics: {e}")
            raise e