import os
from pathlib import Path

from entities.run import Run


class PathsService:
    KRAKEN2_READS = "kraken2_reads"
    KRAKEN2_CONTIGS = "kraken2_contigs"
    DIAMOND_READS = "diamond_reads"
    DIAMOND_CONTIGS = "diamond_contigs"

    def __init__(self):
        pass

    def get_app_data_base_dir(self) -> Path:
        """User-wide app data root (~/.rt-metagenomics). Created if missing."""
        base = Path.home() / ".rt-metagenomics"
        base.mkdir(parents=True, exist_ok=True)
        return base

    def get_external_databases_dir(self) -> Path:
        """Root directory for downloaded tool databases (Kraken2, Krona, taxdump, etc.)."""
        databases = self.get_app_data_base_dir() / "databases"
        databases.mkdir(parents=True, exist_ok=True)
        return databases

    def get_output_path(self, run: Run) -> str:
        """Base output directory (ViralUnity `output` argument before run_name)."""
        return f"{self.get_app_data_base_dir()}/output/{run.id}_output_{run.name}"

    def get_run_name_for_pipeline(self, run: Run) -> str:
        """Subfolder name written by ViralUnity ConfigGenerator (parameters id + run name)."""
        pid = run.parameters.id if run.parameters.id is not None else run.id
        return f"{pid}_{run.name}"

    def get_pipeline_output_root(self, run: Run) -> str:
        """Root directory where Snakemake writes (output + run_name)."""
        base = self.get_output_path(run).rstrip("/")
        return os.path.join(base, self.get_run_name_for_pipeline(run)) + "/"

    def get_config_path(self, run: Run) -> str:
        return f"{self.get_output_path(run)}/config.yaml"

    def get_sample_output_dir(self, run: Run, kind: str) -> str:
        return f"{self.get_pipeline_output_root(run)}metagenomics/taxonomic_assignments/{kind}/"

    def get_krona_html_path(self, run: Run, sample_name: str, kind: str) -> str:
        """
        kind: kraken2_reads | kraken2_contigs | diamond_reads | diamond_contigs
        """
        sample_key = f"sample-{sample_name}"
        filenames = {
            self.KRAKEN2_READS: f"{sample_key}.output.krona.html",
            self.KRAKEN2_CONTIGS: f"{sample_key}.output.krona.html",
            self.DIAMOND_READS: f"{sample_key}.diamond.filtered.krona.html",
            self.DIAMOND_CONTIGS: f"{sample_key}.diamond.supported.filtered.krona.html",
        }
        filename = filenames.get(kind, f"{sample_key}.output.krona.html")
        return os.path.join(
            self.get_pipeline_output_root(run),
            "metagenomics",
            "taxonomic_assignments",
            kind,
            "reports",
            filename,
        )

    def get_kraken2_reads_krona_txt_path(self, run: Run, sample_name: str) -> str:
        """Kraken2 reads ktImport input (taxonomy counts) before per-sample symlinks."""
        root = self.get_pipeline_output_root(run)
        return os.path.join(
            root,
            "metagenomics",
            "taxonomic_assignments",
            self.KRAKEN2_READS,
            "results",
            f"sample-{sample_name}.output.krona.txt",
        )

    def get_diamond_reads_krona_input_path(self, run: Run, sample_name: str) -> str:
        """Diamond reads Krona input TSV used for sequence metrics."""
        root = self.get_pipeline_output_root(run)
        return os.path.join(
            root,
            "metagenomics",
            "taxonomic_assignments",
            self.DIAMOND_READS,
            "results",
            f"sample-{sample_name}.diamond.supported.krona_input.tsv",
        )

    def get_reads_krona_metrics_path(self, run: Run, sample_name: str, kind: str) -> str:
        if kind == self.DIAMOND_READS:
            return self.get_diamond_reads_krona_input_path(run, sample_name)
        return self.get_kraken2_reads_krona_txt_path(run, sample_name)

    def get_kraken2_reads_report_path(self, run: Run, sample_name: str) -> str:
        """Symlinked Kraken2 reads report under samples/ (after organize_files)."""
        return os.path.join(
            self.get_sample_output_dir(run, self.KRAKEN2_READS),
            "results",
            f"sample-{sample_name}.report.txt",
        )

    def get_taxa_summary_bleed_path(self, run: Run, kind: str) -> str:
        """Aggregated taxa table with RPM and bleed filter (all samples)."""
        return os.path.join(
            self.get_sample_output_dir(run, kind),
            f"{kind}_taxa_summary_RPM.bleed.tsv",
        )

    def get_kraken2_reads_taxa_summary_bleed_path(self, run: Run) -> str:
        return self.get_taxa_summary_bleed_path(run, self.KRAKEN2_READS)

    def get_diamond_reads_taxa_summary_bleed_path(self, run: Run) -> str:
        return self.get_taxa_summary_bleed_path(run, self.DIAMOND_READS)

    def get_preferred_reads_kinds(self, run: Run) -> list[str]:
        """Read-level classification kinds to try, in priority order."""
        kinds = [self.KRAKEN2_READS]
        if run.parameters.runDiamondReads:
            kinds.append(self.DIAMOND_READS)
        return kinds

    def get_preferred_krona_kinds(self, run: Run) -> list[str]:
        kinds = [self.KRAKEN2_READS]
        if run.parameters.runDiamondReads:
            kinds.append(self.DIAMOND_READS)
        if run.parameters.runDiamondContigs:
            kinds.append(self.DIAMOND_CONTIGS)
        if run.parameters.runDenovoAssembly:
            kinds.append(self.KRAKEN2_CONTIGS)
        return kinds
