import logging
import os
import csv
from typing import List, Dict, Optional, Any, TypedDict

from services.paths_service import PathsService
from services.taxonomy_utils import load_taxdump_nodes, get_taxid_at_rank
from entities.run import Run
from config import config

logger = logging.getLogger('uvicorn.error')


class SequenceMetrics(TypedDict):
    """Type definition for sequence metrics dictionary."""
    nSequences: int
    nIdentifiedSequences: int
    percentageOfIdentifiedSequences: float


class Pathogen(TypedDict):
    """Type definition for pathogen information."""
    pathogen: str
    nReads: int


class Pathology(TypedDict):
    """Type definition for pathology family information."""
    name: str
    nReads: int
    pathogens: List[Pathogen]


class SampleMetrics(TypedDict):
    """Type definition for sample metrics dictionary."""
    nSequences: int
    nIdentifiedSequences: int
    percentageOfIdentifiedSequences: float
    pathologies: List[Pathology]


class MetricsService:
    """Service for processing metagenomics metrics and sample data."""
    def __init__(self, paths_service: PathsService):
        """Initialize the MetricsService."""
        self.paths_service = paths_service

    SAMPLE_PREFIX = "sample-"
    KRAKEN2_TOOL = "kraken2"
    DIAMOND_TOOL = "diamond"
    READS_MODE = "reads"
    FAMILY_RANK = "family"
    SPECIES_RANK = "species"

    def _tool_for_kind(self, kind: str) -> str:
        if kind.startswith("diamond"):
            return self.DIAMOND_TOOL
        return self.KRAKEN2_TOOL

    def _resolve_reads_classification_kind(self, run: Run) -> str:
        for kind in self.paths_service.get_preferred_reads_kinds(run):
            summary_path = self.paths_service.get_taxa_summary_bleed_path(run, kind)
            if os.path.exists(summary_path):
                return kind
        return self.paths_service.KRAKEN2_READS

    def get_sample_file_path_from_sample_name(self, run: Run, sample_name: str) -> str:
        kind = self._resolve_reads_classification_kind(run)
        return self.paths_service.get_reads_krona_metrics_path(run, sample_name, kind)

    def get_summary_metrics(self, run: Run) -> Dict[str, Any]:
        """
        Extract summary metrics from the metagenomics summary file.

        Args:
            run_id: The run identifier
            run_name: The run name

        Returns:
            List of summary metrics dictionaries or None if file doesn't exist
        """
        samples = [self.get_sample_file_path_from_sample_name(run, sample.name) for sample in run.samples]
        sample_summary_metric = {}
        for sample_file_path in samples:
            sample_summary_metric[sample_file_path] = self._process_sequence_metrics(sample_file_path)

        nTotalReads = sum([sample_summary_metric[sample]["nSequences"] for sample in sample_summary_metric if sample_summary_metric[sample] is not None])
        nTotalIdentifiedReads = sum([sample_summary_metric[sample]["nIdentifiedSequences"] for sample in sample_summary_metric if sample_summary_metric[sample] is not None])

        percentageOfIdentifiedReads = nTotalIdentifiedReads / nTotalReads if nTotalReads > 0 else 0.0
        summary_metrics = {
            "nTotalReads": nTotalReads,
            "nTotalIdentifiedReads": nTotalIdentifiedReads,
            "percentageOfIdentifiedReads": percentageOfIdentifiedReads,
            "meanTimeOfAnalysis": run.totalElapsedTimeOfAnalysisExecutionSeconds/run.iteration if run.iteration > 0 else 0.0,
            "lastAnalysisTime": run.lastElapsedTimeOfAnalysisExecutionSeconds,
            "iteration": run.iteration,
            "executionHashTime": run.executionHashTime,
        }

        return summary_metrics

    def extract_sample_name(self, file_name: str) -> str:
        """
        Extract sample name from file path.

        Args:
            file_name: Full file path containing sample name

        Returns:
            Extracted sample name (e.g., 'dengue' from 'sample-dengue.report.txt')
        """
        filename = file_name.split("/")[-1]
        base = filename.split(".")[0]
        return base.replace(self.SAMPLE_PREFIX, "")

    def get_sample_metrics(self, run: Run, sample_name: str) -> Optional[Dict[str, SampleMetrics]]:
        """
        Get comprehensive metrics for a specific sample.

        Args:
            run: The run entity
            sample_name: The sample name

        Returns:
            Dictionary containing sample metrics or None if files don't exist
        """
        sample_file_path = self.get_sample_file_path_from_sample_name(run, sample_name)

        if not os.path.exists(sample_file_path):
            logger.warning(f"Sample file not found: {sample_file_path}")
            return None

        sample_metrics = {}

        sequence_metrics = self._process_sequence_metrics(sample_file_path)
        if sequence_metrics is None:
            return None
        sample_metrics.update(sequence_metrics)

        kind = self._resolve_reads_classification_kind(run)
        summary_path = self.paths_service.get_taxa_summary_bleed_path(run, kind)
        tool = self._tool_for_kind(kind)
        taxdump_dir = self._resolve_taxdump_dir(run)
        if os.path.exists(summary_path):
            pathologies = self._process_pathology_data_from_taxa_summary(
                summary_path, sample_name, taxdump_dir, tool=tool
            )
            sample_metrics["pathologies"] = pathologies
        else:
            logger.warning(f"Taxa summary file not found: {summary_path}")
            sample_metrics["pathologies"] = []

        return sample_metrics

    def _resolve_taxdump_dir(self, run: Run) -> Optional[str]:
        candidates = []
        if run.parameters.taxdump:
            candidates.append(run.parameters.taxdump)
        candidates.append(config.taxdump.default_path)
        candidates.append(
            str(self.paths_service.get_external_databases_dir() / "taxdump")
        )

        for path in candidates:
            if path and os.path.isfile(os.path.join(path, "nodes.dmp")):
                return path

        logger.warning("Taxdump not found; species will not be linked to families")
        return None

    @staticmethod
    def _is_bleed_pass(value: Optional[str]) -> bool:
        if value is None:
            return False
        return str(value).strip().lower() in ("true", "1", "yes")

    def _process_pathology_data_from_taxa_summary(
        self,
        summary_path: str,
        sample_name: str,
        taxdump_dir: Optional[str],
        tool: str = KRAKEN2_TOOL,
    ) -> List[Pathology]:
        """Build pathologies from a taxa_summary_RPM.bleed.tsv file."""
        sample_key = f"{self.SAMPLE_PREFIX}{sample_name}"
        families_by_taxid: Dict[str, Pathology] = {}
        nodes = None

        if taxdump_dir:
            try:
                nodes = load_taxdump_nodes(taxdump_dir)
            except OSError as e:
                logger.error(f"Error loading taxdump from {taxdump_dir}: {e}")

        try:
            with open(summary_path, "r") as file:
                reader = csv.DictReader(file, delimiter="\t")
                for row in reader:
                    if row.get("sample") != sample_key:
                        continue
                    if row.get("tool") != tool:
                        continue
                    if row.get("mode") != self.READS_MODE:
                        continue
                    if not self._is_bleed_pass(row.get("bleed_pass")):
                        continue

                    rank = row.get("rank", "")
                    taxid = row.get("taxid", "")
                    name = row.get("name", "")
                    try:
                        count = int(row.get("count", "0"))
                    except ValueError:
                        continue

                    if rank == self.FAMILY_RANK:
                        families_by_taxid[taxid] = {
                            "name": name,
                            "nReads": count,
                            "pathogens": [],
                        }
                    elif rank == self.SPECIES_RANK and nodes is not None:
                        family_taxid = get_taxid_at_rank(taxid, self.FAMILY_RANK, nodes)
                        if family_taxid and family_taxid in families_by_taxid:
                            families_by_taxid[family_taxid]["pathogens"].append({
                                "pathogen": name,
                                "nReads": count,
                            })

            pathologies = list(families_by_taxid.values())
            for pathology in pathologies:
                pathology["pathogens"].sort(
                    key=lambda p: p["nReads"], reverse=True
                )
            pathologies.sort(key=lambda p: p["nReads"], reverse=True)
            return pathologies

        except (IOError, ValueError) as e:
            logger.error(
                f"Error processing pathology data from {summary_path}: {e}"
            )
            return []

    def _process_sequence_metrics(self, sample_file_path: str) -> Optional[SequenceMetrics]:
        """Process sequence identification metrics from krona file."""
        try:
            with open(sample_file_path, 'r') as file:
                reader = csv.reader(file, delimiter="\t")
                n_sequences = 0
                n_identified_sequences = 0

                for row in reader:
                    n_sequences += 1
                    if len(row) > 1 and row[1] != "0":
                        n_identified_sequences += 1

                percentage_identified = n_identified_sequences / n_sequences if n_sequences > 0 else 0

                return {
                    "nSequences": n_sequences,
                    "nIdentifiedSequences": n_identified_sequences,
                    "percentageOfIdentifiedSequences": percentage_identified
                }
        except FileNotFoundError:
            logger.debug(f"File not found for {sample_file_path}")
            return None
        except (IOError, IndexError, ValueError) as e:
            logger.error(f"Error processing sequence metrics from {sample_file_path}: {e}")
            return None
