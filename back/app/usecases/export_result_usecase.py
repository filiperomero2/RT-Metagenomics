import logging
from entities.run import Run
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from services.export_result_service import ExportResultService

logger = logging.getLogger('uvicorn.error')


class ExportResultUseCase:
    def __init__(
        self,
        export_result_service: ExportResultService,
        repository: MetagenomicsRunRepository
    ):
        self.export_result_service = export_result_service
        self.repository = repository

    def execute_stream(self, run_id: int):
        """
        Stream result files for a metagenomics run without saving to disk.
        
        Args:
            run_id: The ID of the run to export
            
        Returns:
            Tuple containing:
            - Generator that yields ZIP file chunks as bytes
            - Content type (application/zip)
            - Filename for the download
            
        Raises:
            FileNotFoundError: If the run or files don't exist
            ValueError: If the run doesn't exist
        """
        logger.debug(f"Streaming export for run_id: {run_id}")
        
        run = self.repository.get_run(run_id)
        
        if run is None:
            logger.error(f"Run with ID {run_id} not found.")
            raise ValueError(f"Run with ID {run_id} not found.")
        
        return self.export_result_service.export_stream(run)
    
    def execute(self, run_id: int) -> dict:
        """
        Export result files for a metagenomics run (saves to disk).
        
        Note: This method is kept for backward compatibility.
        Consider using execute_stream() for better performance.
        
        Args:
            run_id: The ID of the run to export
            
        Returns:
            Dictionary containing file information:
            - file_path: Path to the zip file
            - file_size: Size of the file in bytes
            - content_type: MIME type of the file
            - filename: Suggested filename for download
            
        Raises:
            FileNotFoundError: If the run or files don't exist
            ValueError: If the run doesn't exist
        """
        logger.debug(f"Exporting result for run_id: {run_id}")
        
        run = self.repository.get_run(run_id)
        
        if run is None:
            logger.error(f"Run with ID {run_id} not found.")
            raise ValueError(f"Run with ID {run_id} not found.")
        
        return self.export_result_service.export(run)

