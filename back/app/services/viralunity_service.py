import logging
import os
import hashlib
import csv
import time

from sqlmodel import Session, select
from entities.enum import RunState
from entities.metagenomic_run import MetagenomicRun
from infra.database.db import engine
from entities.metagenomics_parameters import MetagenomicsParameters
from viralunity.viralunity.viralunity_meta import main as metagenomics
from services.viralunity_domain_logic import ViralUnityDomainLogic
from config import config

logger = logging.getLogger('uvicorn.error')


class ViralUnityService:
    def __init__(self, domain_logic: ViralUnityDomainLogic):
        self.domain_logic = domain_logic

    def main(self):
        logger.info("Starting ViralUnityService main thread...")
        while True:
            try:
                with Session(engine) as db_session:
                    stmt = select(MetagenomicRun).where(MetagenomicRun.state == RunState.PENDING).limit(1)
                    next_task = db_session.exec(stmt).first()
                    if next_task is None:
                        logger.debug("No task to process, waiting for new tasks...")
                        time.sleep(config.service.polling_interval)
                        continue
                    try:
                        stmt = select(MetagenomicsParameters).where(MetagenomicsParameters.id == next_task.parametersId).limit(1)
                        metagenomics_parameters = db_session.exec(stmt).first()
                        task_hash = self.domain_logic.get_hash_of_task(metagenomics_parameters)
                        if task_hash == next_task.executionHash:
                            logger.debug(f"Task {next_task.id} already processed, marking as COMPLETED.")
                            next_task.state = RunState.COMPLETED
                            db_session.add(next_task)
                            db_session.commit()
                            continue
                        if metagenomics_parameters is None:
                            logger.error(f"Parameters for run {next_task.id} not found.")
                            next_task.state = RunState.FAILED
                            db_session.add(next_task)
                            db_session.commit()
                            continue
                        params = self.domain_logic.prepare_metagenomics_params(metagenomics_parameters)
                        next_task.state = RunState.RUNNING
                        next_task.iteration += 1
                        next_task.executionHash = task_hash
                        db_session.add(next_task)
                        db_session.commit()
                        result = metagenomics(params)
                        logger.debug(f"Metagenomics run completed with result: {result}")
                        next_task.state = RunState.PENDING
                        db_session.add(next_task)
                        db_session.commit()
                    except Exception as e:
                        next_task.state = RunState.FAILED
                        next_task.errorMessage = str(e)
                        db_session.add(next_task)
                        db_session.commit()
                        logger.error(f"Error during metagenomics run: {e}")
            except Exception as e:
                logger.error(f"Error in ViralUnityService main thread: {e}")
    
    def enqueue_metagenomics(self, metagenomics_parameters: MetagenomicsParameters):        
        with Session(engine) as db_session:
            try:
                db_session.add(metagenomics_parameters)
                db_session.commit()
                run = MetagenomicRun(state=RunState.PENDING, iteration=0, parametersId=metagenomics_parameters.id)
                db_session.add(run)
                db_session.commit()
                return run
            except Exception as e:
                logger.error(f"Error starting metagenomics: {e}")
                db_session.rollback()
                raise e