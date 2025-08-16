import logging
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from config import config
import os

logger = logging.getLogger('uvicorn.error')

class GetMetagenomicsResultUseCase:
    def __init__(self, repository: MetagenomicsRunRepository):
        self.repository = repository

    def execute(self, run_id: int, sample_id: str):
        run = self.repository.get_run(run_id)
        sample = next(x for x in run.samples if x.id == sample_id)
        if sample is not None:
            parameters = run.parameters
            file_path = f"{config.output_dir}/{run.id}_{run.name}/metagenomics/taxonomic_assignments/reports/sample-{sample.name}.output.krona.html"
            
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