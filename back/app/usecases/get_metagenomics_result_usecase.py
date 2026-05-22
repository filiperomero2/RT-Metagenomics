import logging
from services.paths_service import PathsService
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from config import config
import os

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsResultUseCase:
    def __init__(self, repository: MetagenomicsRunRepository, paths_service: PathsService):
        self.repository = repository
        self.paths_service = paths_service

    def execute(self, run_id: int, sample_id: str):
        run = self.repository.get_run(run_id)
        sample = next(x for x in run.samples if x.id == sample_id)
        if sample is not None:
            file_path = self.paths_service.get_krona_html_path(run, sample.name, "kraken2_reads")
            
            # Check if file exists
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Krona HTML file not found: {file_path}")
            
            # Return file info instead of content
            return {
                "file_path": file_path,
                "file_size": os.path.getsize(file_path),
                "content_type": "text/html",
                "filename": f"sample-{sample.name}.output.krona.html"
            }