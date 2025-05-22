import logging
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, select
from entities.enum import RunState
from entities.metagenomic_run import MetagenomicRun
from infra.database.db import engine
from infra.singleton import Singleton
from entities.metagenomics_parameters import MetagenomicsParameters
from viralunity.viralunity_meta import main as metagenomics

import time

def get_viralunity_service():
    return ViralUnityService()

logger = logging.getLogger('uvicorn.error')

class ViralUnityService(metaclass=Singleton):
    def main(self):
        logger.info("Starting ViralUnityService main thread...")
        while True:
            try:
                with Session(engine) as db_session:
                    stmt = select(MetagenomicRun).where(MetagenomicRun.state == RunState.PENDING).limit(1)
                    next_task = db_session.exec(stmt).first()
                    if next_task is None:
                        logger.debug("No task to process, waiting for new tasks...")
                        time.sleep(1)
                        continue
                    try:
                        stmt = select(MetagenomicsParameters).where(MetagenomicsParameters.id == next_task.parametersId).limit(1)
                        metagenomics_parameters = db_session.exec(stmt).first()
                        if metagenomics_parameters is None:
                            logger.error(f"Parameters for run {next_task.id} not found.")
                            next_task.state = RunState.FAILED
                            db_session.add(next_task)
                            db_session.commit()
                            continue
                        params = {
                            "data_type": metagenomics_parameters.dataType.value,
                            "sample_sheet": metagenomics_parameters.sampleSheetFilePath,
                            "config_file": metagenomics_parameters.outputDir + "/config.yaml",
                            "run_name": metagenomics_parameters.runName,
                            "kraken2_database": metagenomics_parameters.kraken2DatabasePath,
                            "krona_database": metagenomics_parameters.kronaDatabasePath,
                            "adapters": metagenomics_parameters.adaptersPath,
                            "threads": metagenomics_parameters.threads,
                            "threads_total": metagenomics_parameters.threadsTotal,
                            "output": metagenomics_parameters.outputDir,
                            "remove_human_reads": metagenomics_parameters.removeHumanReads,
                            "remove_unclassified_reads": metagenomics_parameters.removeUnclassifiedReads,
                            "create_config_only": False,
                            "minimum_read_length": 50,
                            "trim": metagenomics_parameters.trim,
                        }
                        next_task.state = RunState.RUNNING
                        db_session.add(next_task)
                        db_session.commit()
                        result = metagenomics(params)
                        logger.debug(f"Metagenomics run completed with result: {result}")
                    except Exception as e:
                        next_task.state = RunState.FAILED
                        next_task.errorMessage = str(e)
                        db_session.add(next_task)
                        db_session.commit()
                        logger.error(f"Error during metagenomics run: {e}")
            except Exception as e:
                logger.error(f"Error in ViralUnityService main thread: {e}")
    
    def __init__(self):
        pass

    def start_metagenomics(self, metagenomics_parameters: MetagenomicsParameters):        
        with Session(engine) as db_session:
            try:
                db_session.add(metagenomics_parameters)
                db_session.commit()
                run = MetagenomicRun(state=RunState.PENDING, iteration=1, parametersId=metagenomics_parameters.id)
                db_session.add(run)
                db_session.commit()
                return run
            except Exception as e:
                logger.error(f"Error starting metagenomics: {e}")
                db_session.rollback()
                raise e

ViralUnityServiceDependency = Annotated[ViralUnityService, Depends(get_viralunity_service)]