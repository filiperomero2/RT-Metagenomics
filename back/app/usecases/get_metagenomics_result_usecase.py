import logging
import os
from services.paths_service import PathsService
from repositories.metagenomics_run_repository import MetagenomicsRunRepository

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsResultUseCase:
    def __init__(self, repository: MetagenomicsRunRepository, paths_service: PathsService):
        self.repository = repository
        self.paths_service = paths_service

    def execute(self, run_id: int, sample_id: str):
        run = self.repository.get_run(run_id)
        sample = next(x for x in run.samples if x.id == sample_id)
        if sample is not None:
            file_path = self._resolve_krona_html_path(run, sample.name)
            
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Krona HTML file not found: {file_path}")
            
            return {
                "file_path": file_path,
                "file_size": os.path.getsize(file_path),
                "content_type": "text/html",
                "filename": os.path.basename(file_path),
            }

    def _resolve_krona_html_path(self, run, sample_name: str) -> str:
        for kind in self.paths_service.get_preferred_krona_kinds(run):
            file_path = self.paths_service.get_krona_html_path(run, sample_name, kind)
            if os.path.exists(file_path):
                return file_path

        return self.paths_service.get_krona_html_path(
            run, sample_name, self.paths_service.KRAKEN2_READS
        )
