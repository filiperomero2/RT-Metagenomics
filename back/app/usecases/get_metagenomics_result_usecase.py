import logging
import os

from services.paths_service import PathsService
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger("uvicorn.error")

_VALID_KINDS = frozenset(
    {"kraken2_reads", "kraken2_contigs", "diamond_reads", "diamond_contigs"}
)


class GetMetagenomicsResultUseCase:
    def __init__(
        self,
        repository: MetagenomicsRunRepository,
        paths_service: PathsService,
    ):
        self.repository = repository
        self.paths_service = paths_service

    def execute(
        self,
        run_id: int,
        sample_id: int,
        kind: str = "kraken2_reads",
    ):
        if kind not in _VALID_KINDS:
            raise ValueError(
                f"Invalid kind '{kind}'. Expected one of: {', '.join(sorted(_VALID_KINDS))}"
            )

        run = self.repository.get_run(run_id)
        if run is None:
            raise ValueError(f"Run with ID {run_id} not found.")

        sample = next((s for s in run.samples if s.id == sample_id), None)
        if sample is None:
            raise ValueError(f"Sample with ID {sample_id} not found for run {run_id}.")

        file_path = self.paths_service.get_krona_html_path(run, sample.name, kind)

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Krona HTML file not found: {file_path}")

        return {
            "file_path": file_path,
            "file_size": os.path.getsize(file_path),
            "content_type": "text/html",
            "filename": f"{kind}-sample-{sample.name}.krona.html",
        }
