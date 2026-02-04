import json
import logging
from typing import List
from entities.enum import DataType, RunState
from entities.run import Run
from entities.sample import Sample
from entities.run_parameters import RunParameters
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from services.viralunity_service import ViralUnityService
from exceptions import TaskExecutionError

logger = logging.getLogger("uvicorn.error")

class CreateMetagenomicsSampleInput:
    def __init__(
        self,
        name: str,
        barcode: str,
    ):
        self.name = name
        self.barcode = barcode

class CreateMetagenomicsRunInput:
    def __init__(
        self,
        dataType: DataType,
        samples: List[CreateMetagenomicsSampleInput],
        runName: str,
        path: str,
        trim: int,
        threads: int,
        threadsTotal: int,
        removeHumanReads: bool,
        removeUnclassifiedReads: bool,
        minimumReadLength: int,
        kraken2Database: str,
        kronaDatabase: str,
    ):
        self.dataType = dataType
        self.samples = samples
        self.runName = runName
        self.path = path
        self.trim = trim
        self.threads = threads
        self.threadsTotal = threadsTotal
        self.removeHumanReads = removeHumanReads
        self.removeUnclassifiedReads = removeUnclassifiedReads
        self.minimumReadLength = minimumReadLength
        self.kraken2Database = kraken2Database
        self.kronaDatabase = kronaDatabase
        
    def __repr__(self):
        return f"CreateMetagenomicsRunInput(dataType={self.dataType}, samples={self.samples}, runName={self.runName}, trim={self.trim}, threads={self.threads}, threadsTotal={self.threadsTotal}, removeHumanReads={self.removeHumanReads}, removeUnclassifiedReads={self.removeUnclassifiedReads}, minimumReadLength={self.minimumReadLength}, kraken2Database={self.kraken2Database}, kronaDatabase={self.kronaDatabase})"


class CreateMetagenomicsRunUseCase:
    def __init__(
        self, viralunity_service: ViralUnityService, repository: MetagenomicsRunRepository
    ):
        self.viralunity_service = viralunity_service
        self.repository = repository

    def execute(self, metagenomics_parameters: CreateMetagenomicsRunInput):
        logger.debug(
            f"Starting metagenomics with parameters: {metagenomics_parameters}"
        )

        run = Run(
            name=metagenomics_parameters.runName,
            state=RunState.PENDING,
            parameters=RunParameters(
                path=metagenomics_parameters.path,
                dataType=metagenomics_parameters.dataType,
                trim=metagenomics_parameters.trim,
                threads=metagenomics_parameters.threads,
                threadsTotal=metagenomics_parameters.threadsTotal,
                removeHumanReads=metagenomics_parameters.removeHumanReads,
                removeUnclassifiedReads=metagenomics_parameters.removeUnclassifiedReads,
                minimumReadLength=metagenomics_parameters.minimumReadLength,
                kraken2Database=metagenomics_parameters.kraken2Database,
                kronaDatabase=metagenomics_parameters.kronaDatabase,
            ),
            samples=[
                Sample(name=sample.name, sampleLib=sample.barcode)
                for sample in metagenomics_parameters.samples
            ],
        )
        
        try:
            logger.debug(
                f"Creating metagenomics run with parameters: {metagenomics_parameters}"
            )
            run = self.repository.save_run(run)
            return run
        except Exception as e:
            logger.error(f"Failed to start metagenomics: {e}")
            raise TaskExecutionError(
                f"Failed to start metagenomics: {e}", "TASK_START_FAILED"
            )
