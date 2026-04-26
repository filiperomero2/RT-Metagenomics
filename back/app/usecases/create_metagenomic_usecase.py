import logging
from typing import List

from entities.enum import DataType, RunState
from entities.run import Run
from entities.sample import Sample
from entities.run_parameters import RunParameters
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from services.viralunity_service import ViralUnityService
from exceptions import ParameterValidationError, TaskExecutionError

logger = logging.getLogger("uvicorn.error")


class CreateMetagenomicsSampleInput:
    def __init__(
        self,
        name: str,
        barcode: str,
        is_negative_control: bool = False,
    ):
        self.name = name
        self.barcode = barcode
        self.is_negative_control = is_negative_control


class CreateMetagenomicsRunInput:
    def __init__(
        self,
        dataType: DataType,
        samples: List[CreateMetagenomicsSampleInput],
        runName: str,
        path: str,
        threads: int,
        threadsTotal: int,
        removeHumanReads: bool,
        removeUnclassifiedReads: bool,
        minimumReadLength: int,
        kraken2Database: str,
        kronaDatabase: str,
        adapters: str | None,
        trimHead: int | None,
        trimTail: int | None,
        runDenovoAssembly: bool,
        runKraken2Reads: bool,
        runKraken2Contigs: bool,
        runDiamondReads: bool,
        runDiamondContigs: bool,
        hostReference: str | None,
        deaconIndex: str | None,
        taxdump: str | None,
        diamondDatabase: str | None,
        taxids: str | None,
        bleedFraction: float,
        negativePThreshold: float,
        minimumHitGroup: int,
        runPolishRacon: bool,
        runPolishMedaka: bool,
        medakaModel: str | None,
        runReferenceAssembly: bool,
        referenceAssemblyMethod: str | None,
        referenceAssemblySource: str | None,
        viralGenomes: str | None,
        viralTaxids: str | None,
    ):
        self.dataType = dataType
        self.samples = samples
        self.runName = runName
        self.path = path
        self.threads = threads
        self.threadsTotal = threadsTotal
        self.removeHumanReads = removeHumanReads
        self.removeUnclassifiedReads = removeUnclassifiedReads
        self.minimumReadLength = minimumReadLength
        self.kraken2Database = kraken2Database
        self.kronaDatabase = kronaDatabase
        self.adapters = adapters
        self.trimHead = trimHead
        self.trimTail = trimTail
        self.runDenovoAssembly = runDenovoAssembly
        self.runKraken2Reads = runKraken2Reads
        self.runKraken2Contigs = runKraken2Contigs
        self.runDiamondReads = runDiamondReads
        self.runDiamondContigs = runDiamondContigs
        self.hostReference = hostReference
        self.deaconIndex = deaconIndex
        self.taxdump = taxdump
        self.diamondDatabase = diamondDatabase
        self.taxids = taxids
        self.bleedFraction = bleedFraction
        self.negativePThreshold = negativePThreshold
        self.minimumHitGroup = minimumHitGroup
        self.runPolishRacon = runPolishRacon
        self.runPolishMedaka = runPolishMedaka
        self.medakaModel = medakaModel
        self.runReferenceAssembly = runReferenceAssembly
        self.referenceAssemblyMethod = referenceAssemblyMethod
        self.referenceAssemblySource = referenceAssemblySource
        self.viralGenomes = viralGenomes
        self.viralTaxids = viralTaxids


class CreateMetagenomicsRunUseCase:
    def __init__(
        self,
        viralunity_service: ViralUnityService,
        repository: MetagenomicsRunRepository,
    ):
        self.viralunity_service = viralunity_service
        self.repository = repository

    def execute(self, metagenomics_parameters: CreateMetagenomicsRunInput):
        logger.debug(
            f"Starting metagenomics with parameters: {metagenomics_parameters}"
        )

        self.validate_metagenomics_parameters(metagenomics_parameters)

        run = Run(
            name=metagenomics_parameters.runName,
            state=RunState.PENDING,
            parameters=RunParameters(
                path=metagenomics_parameters.path,
                dataType=metagenomics_parameters.dataType,
                threads=metagenomics_parameters.threads,
                threadsTotal=metagenomics_parameters.threadsTotal,
                removeHumanReads=metagenomics_parameters.removeHumanReads,
                removeUnclassifiedReads=metagenomics_parameters.removeUnclassifiedReads,
                minimumReadLength=metagenomics_parameters.minimumReadLength,
                kraken2Database=metagenomics_parameters.kraken2Database,
                kronaDatabase=metagenomics_parameters.kronaDatabase,
                adapters=metagenomics_parameters.adapters,
                trimHead=metagenomics_parameters.trimHead,
                trimTail=metagenomics_parameters.trimTail,
                runDenovoAssembly=metagenomics_parameters.runDenovoAssembly,
                runKraken2Reads=metagenomics_parameters.runKraken2Reads,
                runKraken2Contigs=metagenomics_parameters.runKraken2Contigs,
                runDiamondReads=metagenomics_parameters.runDiamondReads,
                runDiamondContigs=metagenomics_parameters.runDiamondContigs,
                hostReference=metagenomics_parameters.hostReference,
                deaconIndex=metagenomics_parameters.deaconIndex,
                taxdump=metagenomics_parameters.taxdump,
                diamondDatabase=metagenomics_parameters.diamondDatabase,
                taxids=metagenomics_parameters.taxids,
                bleedFraction=metagenomics_parameters.bleedFraction,
                negativePThreshold=metagenomics_parameters.negativePThreshold,
                minimumHitGroup=metagenomics_parameters.minimumHitGroup,
                runPolishRacon=metagenomics_parameters.runPolishRacon,
                runPolishMedaka=metagenomics_parameters.runPolishMedaka,
                medakaModel=metagenomics_parameters.medakaModel,
                runReferenceAssembly=metagenomics_parameters.runReferenceAssembly,
                referenceAssemblyMethod=metagenomics_parameters.referenceAssemblyMethod,
                referenceAssemblySource=metagenomics_parameters.referenceAssemblySource,
                viralGenomes=metagenomics_parameters.viralGenomes,
                viralTaxids=metagenomics_parameters.viralTaxids,
            ),
            samples=[
                Sample(
                    name=sample.name,
                    sampleLib=sample.barcode,
                    isNegativeControl=sample.is_negative_control,
                )
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

    def validate_metagenomics_parameters(
        self, metagenomics_parameters: CreateMetagenomicsRunInput
    ):
        if not metagenomics_parameters.runDenovoAssembly:
            if metagenomics_parameters.runKraken2Contigs:
                raise ParameterValidationError(
                    "Kraken2 on contigs requires de novo assembly (MEGAHIT). "
                    "Enable runDenovoAssembly or set runKraken2Contigs to false."
                )
            if metagenomics_parameters.runDiamondContigs:
                raise ParameterValidationError(
                    "Diamond on contigs requires de novo assembly. "
                    "Enable runDenovoAssembly or set runDiamondContigs to false."
                )

        any_diamond = (
            metagenomics_parameters.runDiamondReads
            or metagenomics_parameters.runDiamondContigs
        )
        if any_diamond:
            if not metagenomics_parameters.diamondDatabase:
                raise ParameterValidationError("Diamond database path is required")
            if not metagenomics_parameters.taxids:
                raise ParameterValidationError(
                    "taxids mapping file (protein2taxid.tsv) is required when Diamond is enabled"
                )

        if metagenomics_parameters.runReferenceAssembly:
            if not metagenomics_parameters.referenceAssemblyMethod:
                raise ParameterValidationError(
                    "referenceAssemblyMethod is required when reference assembly is enabled"
                )
            if not metagenomics_parameters.referenceAssemblySource:
                raise ParameterValidationError(
                    "referenceAssemblySource is required when reference assembly is enabled"
                )
