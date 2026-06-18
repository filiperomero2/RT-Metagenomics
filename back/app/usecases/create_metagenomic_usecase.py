import logging
from typing import List
from entities.enum import DataType, RunState
from entities.run import Run
from entities.sample import Sample
from entities.run_parameters import RunParameters
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from services.viralunity_service import ViralUnityService
from services.taxids_utils import resolve_taxids_path, taxids_file_exists
from exceptions import ParameterValidationError, TaskExecutionError

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
        diamondDatabase: str | None,
        taxdump: str | None,
        taxids: str | None,
        runDiamondReads: bool,
        runDiamondContigs: bool,
        runDenovoAssembly: bool,
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
        self.diamondDatabase = diamondDatabase
        self.taxdump = taxdump
        self.taxids = taxids
        self.runDiamondReads = runDiamondReads
        self.runDiamondContigs = runDiamondContigs
        self.runDenovoAssembly = runDenovoAssembly

    def __repr__(self):
        return (
            f"CreateMetagenomicsRunInput(dataType={self.dataType}, samples={self.samples}, "
            f"runName={self.runName}, trim={self.trim}, threads={self.threads}, "
            f"threadsTotal={self.threadsTotal}, removeHumanReads={self.removeHumanReads}, "
            f"removeUnclassifiedReads={self.removeUnclassifiedReads}, "
            f"minimumReadLength={self.minimumReadLength}, "
            f"kraken2Database={self.kraken2Database}, kronaDatabase={self.kronaDatabase}, "
            f"diamondDatabase={self.diamondDatabase}, taxdump={self.taxdump}, "
            f"taxids={self.taxids}, runDiamondReads={self.runDiamondReads}, "
            f"runDiamondContigs={self.runDiamondContigs}, "
            f"runDenovoAssembly={self.runDenovoAssembly})"
        )


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

        self.validate_metagenomics_parameters(metagenomics_parameters)

        resolved_taxids = resolve_taxids_path(
            metagenomics_parameters.diamondDatabase,
            metagenomics_parameters.taxids,
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
                diamondDatabase=metagenomics_parameters.diamondDatabase,
                taxdump=metagenomics_parameters.taxdump,
                taxids=resolved_taxids,
                runDiamondReads=metagenomics_parameters.runDiamondReads,
                runDiamondContigs=metagenomics_parameters.runDiamondContigs,
                runDenovoAssembly=metagenomics_parameters.runDenovoAssembly,
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

    def validate_metagenomics_parameters(self, metagenomics_parameters: CreateMetagenomicsRunInput):
        any_diamond = (
            metagenomics_parameters.runDiamondReads
            or metagenomics_parameters.runDiamondContigs
        )

        if metagenomics_parameters.runDiamondContigs and not metagenomics_parameters.runDenovoAssembly:
            raise ParameterValidationError(
                "De novo assembly must be enabled when Diamond on contigs is enabled"
            )

        if any_diamond:
            if not metagenomics_parameters.diamondDatabase:
                raise ParameterValidationError("Diamond database is required")
            if not metagenomics_parameters.taxdump:
                raise ParameterValidationError("Taxdump is required for Diamond pipeline")
            if not metagenomics_parameters.kronaDatabase:
                raise ParameterValidationError("Krona database is required for Diamond pipeline")

            resolved_taxids = resolve_taxids_path(
                metagenomics_parameters.diamondDatabase,
                metagenomics_parameters.taxids,
            )
            if not taxids_file_exists(resolved_taxids):
                raise ParameterValidationError(
                    "Taxids mapping file (protein2taxid.tsv) is required for Diamond pipeline"
                )

        if not metagenomics_parameters.kraken2Database:
            raise ParameterValidationError("Kraken2 database is required")

        if not metagenomics_parameters.kronaDatabase:
            raise ParameterValidationError("Krona database is required")

        if not metagenomics_parameters.taxdump:
            raise ParameterValidationError("Taxdump is required")
