import os
from pathlib import Path

from entities.run import Run


class PathsService:
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
        return f"{self.get_pipeline_output_root(run)}/metagenomics/taxonomic_assignments/{kind}/"

    def get_krona_html_path(self, run: Run, sample_name: str, kind: str) -> str:
        """
        kind: kraken2_reads | kraken2_contigs | diamond_reads | diamond_contigs
        """
        return f"{self.get_pipeline_output_root(run)}/metagenomics/taxonomic_assignments/{kind}/reports/sample-{sample_name}.output.krona.html"

    def get_kraken2_reads_krona_txt_path(self, run: Run, sample_name: str) -> str:
        """Kraken2 reads ktImport input (taxonomy counts) before per-sample symlinks."""
        root = self.get_pipeline_output_root(run)
        return os.path.join(
            root,
            "metagenomics",
            "taxonomic_assignments",
            "kraken2_reads",
            "results",
            f"sample-{sample_name}.output.krona.txt",
        )

    def get_kraken2_reads_report_path(self, run: Run, sample_name: str) -> str:
        """Symlinked Kraken2 reads report under samples/ (after organize_files)."""
        return os.path.join(
            self.get_sample_output_dir(run, "kraken2_reads"),
            "results",
            f"sample-{sample_name}.report.txt",
        )

    def get_kraken2_reads_taxa_summary_bleed_path(self, run: Run) -> str:
        """Aggregated Kraken2 reads taxa table with RPM and bleed filter (all samples)."""
        return os.path.join(
            self.get_sample_output_dir(run, "kraken2_reads"),
            "kraken2_reads_taxa_summary_RPM.bleed.tsv",
        )
