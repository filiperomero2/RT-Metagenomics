import logging
import time
import os
import datetime

from services.paths_service import PathsService
from entities.run import Run
from entities.enum import RunState
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from viralunity.viralunity.viralunity_meta import main as vu_metagenomics
from services.file_hash_calculator_service import FileHashCalculatorService
from config import config

logger = logging.getLogger("uvicorn.error")


def _na(val: str | None) -> str:
    if val is None or str(val).strip() == "":
        return "NA"
    return str(val).strip()


class ViralUnityService:
    def __init__(
        self,
        repository: MetagenomicsRunRepository,
        file_hash_calculator: FileHashCalculatorService,
        paths_service: PathsService,
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
                    task_hash = self.file_hash_calculator.get_hash_of_task(
                        next_task.parameters
                    )
                    task_hash_time = datetime.datetime.now()
                    if task_hash == next_task.executionHash:
                        logger.debug(
                            f"No change since last check for Task {next_task.id}. Re-queueing..."
                        )
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

                    out_root = self.paths_service.get_pipeline_output_root(next_task)
                    logger.info(
                        "Starting ViralUnity metagenomics for run_id=%s name=%s output=%s",
                        next_task.id,
                        next_task.name,
                        out_root,
                    )
                    before = time.time()
                    result = vu_metagenomics(params)
                    after = time.time()
                    next_task.lastElapsedTimeOfAnalysisExecutionSeconds = after - before
                    next_task.totalElapsedTimeOfAnalysisExecutionSeconds += (
                        next_task.lastElapsedTimeOfAnalysisExecutionSeconds
                    )

                    if result == 1:
                        next_task.state = RunState.FAILED
                        next_task.errorMessage = "ViralUnity failed to run"
                        logger.error(
                            "ViralUnity metagenomics exited with code 1 for run_id=%s. "
                            "Check Snakemake rule logs under %slogs/ (and conda env build output above).",
                            next_task.id,
                            out_root,
                        )
                    else:
                        next_task.state = RunState.PENDING
                        logger.info(
                            "ViralUnity metagenomics finished OK for run_id=%s (%.1fs)",
                            next_task.id,
                            after - before,
                        )
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
            folder_name = run.parameters.path + "/" + sample.sampleLib
            if os.path.exists(folder_name):
                samples[sample.name] = [folder_name + "/*"]
            else:
                logger.warning(
                    f"Folder {folder_name} does not exist yet, skipping sample {sample.name} for this iteration"
                )

        rp = run.parameters
        base_output_path = self.paths_service.get_output_path(run)
        run_name = self.paths_service.get_run_name_for_pipeline(run)

        negative_controls = []
        for s in run.samples:
            if getattr(s, "isNegativeControl", False):
                negative_controls.append(f"sample-{s.name}")

        data_type = rp.dataType.value

        run_denovo = bool(rp.runDenovoAssembly)
        run_k2_contigs = bool(rp.runKraken2Contigs) if run_denovo else False
        run_diamond_contigs = bool(rp.runDiamondContigs) if run_denovo else False
        if not run_denovo and (rp.runKraken2Contigs or rp.runDiamondContigs):
            logger.warning(
                "run_denovo_assembly is off: forcing run_kraken2_contigs and "
                "run_diamond_contigs off (ViralUnity requires contigs from MEGAHIT)."
            )

        out: dict = {
            "samples": samples,
            "sample_sheet": None,
            "data_type": data_type,
            "config_file": self.paths_service.get_config_path(run),
            "run_name": run_name,
            "output": base_output_path,
            "threads": rp.threads,
            "threads_total": rp.threadsTotal,
            "create_config_only": False,
            "kraken2_database": _na(rp.kraken2Database),
            "krona_database": _na(rp.kronaDatabase),
            "remove_human_reads": bool(rp.removeHumanReads),
            "remove_unclassified_reads": bool(rp.removeUnclassifiedReads),
            "host_reference": _na(rp.hostReference),
            "deacon_index": _na(rp.deaconIndex),
            "taxdump": _na(rp.taxdump),
            "run_denovo_assembly": run_denovo,
            "run_kraken2_reads": bool(rp.runKraken2Reads),
            "run_kraken2_contigs": run_k2_contigs,
            "run_diamond_reads": bool(rp.runDiamondReads),
            "run_diamond_contigs": run_diamond_contigs,
            "taxids": _na(rp.taxids),
            "diamond_database": _na(rp.diamondDatabase),
            "diamond_sensitivity": "sensitive",
            "evalue": 0.001,
            "bleed_fraction": float(rp.bleedFraction if rp.bleedFraction is not None else 0.005),
            "negative_controls": negative_controls,
            "negative_p_threshold": float(
                rp.negativePThreshold if rp.negativePThreshold is not None else 0.01
            ),
            "minimum_hit_group": int(rp.minimumHitGroup if rp.minimumHitGroup is not None else 4),
            "run_reference_assembly": bool(rp.runReferenceAssembly),
            "method": rp.referenceAssemblyMethod or "kraken2",
            "source": rp.referenceAssemblySource or "reads",
            "reads_count": 100,
            "contigs_count": 1,
            "families": "Coronaviridae,Orthomyxoviridae,Flaviviridae,Herpesviridae,Papillomaviridae,Paramyxoviridae,Adenoviridae",
            "reference_selection_strategy": "taxid",
            "blast_qcov": 80,
            "blast_pident": 80,
            "viral_genomes": _na(rp.viralGenomes),
            "viral_taxids": _na(rp.viralTaxids),
            "run_polish_racon": bool(rp.runPolishRacon),
            "run_polish_medaka": bool(rp.runPolishMedaka),
        }
        if rp.medakaModel:
            out["medaka_model"] = rp.medakaModel

        if data_type == "illumina":
            out["minimum_read_length"] = int(
                rp.minimumReadLength
                if rp.minimumReadLength is not None
                else config.service.default_minimum_read_length
            )
            out["adapters"] = _na(rp.adapters)
            out["trim_head"] = int(rp.trimHead if rp.trimHead is not None else 0)
            out["trim_tail"] = int(rp.trimTail if rp.trimTail is not None else 0)

        return out
