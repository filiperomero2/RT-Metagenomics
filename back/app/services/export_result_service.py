import logging
import os
import zipfile
import io
from typing import Optional, Generator, Tuple
from entities.run_parameters import RunParameters
from repositories.metagenomics_run_repository import MetagenomicsRunRepository
from entities.run import Run
from config import config

logger = logging.getLogger('uvicorn.error')


def zip_folder(folder_path: str, zip_filename: str, output_dir: Optional[str] = None) -> str:
    """
    Create a zip file containing all files in a folder.
    
    Args:
        folder_path: Path to the folder to zip
        zip_filename: Name of the output zip file
        output_dir: Directory where the zip file will be created. 
                   If None, uses the output_dir from config.
    
    Returns:
        Path to the created zip file
        
    Raises:
        FileNotFoundError: If the folder doesn't exist
        OSError: If there's an error creating the zip file
    """
    if not os.path.exists(folder_path):
        raise FileNotFoundError(f"Folder not found: {folder_path}")
    
    if not os.path.isdir(folder_path):
        raise ValueError(f"Path is not a directory: {folder_path}")
    
    # Determine output directory
    if output_dir is None:
        raise ValueError("Output directory is required")
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Create full path for zip file
    zip_path = os.path.join(output_dir, zip_filename)
    
    # Create zip file
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Walk through all files and subdirectories
        for root, dirs, files in os.walk(folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                # Create archive name (relative to folder_path)
                arcname = os.path.relpath(file_path, folder_path)
                zipf.write(file_path, arcname)
    
    logger.info(f"Created zip file: {zip_path}")
    return zip_path


class ExportResultService:
    """
    Service responsible for exporting metagenomics result files.
    """
    
    
    def export_stream(
        self,
        run: Run
    ) -> Tuple[Generator[bytes, None, None], str, str]:
        """
        Stream a ZIP file of result files for a metagenomics run without saving to disk.
        
        Args:
            run: The run
            
        Returns:
            Tuple containing:
            - Generator that yields ZIP file chunks as bytes
            - Content type (application/zip)
            - Filename for the download
            
        Raises:
            FileNotFoundError: If the folder doesn't exist
            ValueError: If the run doesn't exist
        """
        folder_path = os.path.join(run.parameters.path + "/../output", f"{run.id}_{run.parameters.name}")
        
        if not os.path.exists(folder_path):
            raise FileNotFoundError(f"Folder not found: {folder_path}")
        
        if not os.path.isdir(folder_path):
            raise ValueError(f"Path is not a directory: {folder_path}")
        
        # Determine filename
        filename = f"{run.id}_{run.name}_{run.iteration}.zip"
        
        def generate_zip() -> Generator[bytes, None, None]:
            """Generator that creates and streams the ZIP file in memory."""
            # Create in-memory ZIP file
            zip_buffer = io.BytesIO()
            
            try:
                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    # Walk through all files and subdirectories
                    for root, dirs, files in os.walk(folder_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            # Create archive name (relative to folder_path)
                            arcname = os.path.relpath(file_path, folder_path)
                            zipf.write(file_path, arcname)
                
                # Get the ZIP data and yield it in chunks
                zip_buffer.seek(0)
                while True:
                    chunk = zip_buffer.read(8192)  # Read in 8KB chunks
                    if not chunk:
                        break
                    yield chunk
            finally:
                zip_buffer.close()
        
        logger.info(f"Streaming ZIP file for run: {run.name}")
        return generate_zip(), 'application/zip', filename
    
    def export(
        self,
        run: Run
    ) -> dict:
        """
        Export result files for a metagenomics run (saves to disk).
        
        Note: This method is kept for backward compatibility.
        Consider using export_stream() for better performance.
        
        Args:
            run: The run
            
        Returns:
            Dictionary containing file information:
            - file_path: Path to the file
            - file_size: Size of the file in bytes
            - content_type: MIME type of the file
            - filename: Suggested filename for download
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            ValueError: If the run or sample doesn't exist
        """
        folder_path = os.path.join(run.parameters.path + "/../output", f"{run.id}_{run.parameters.name}")
        
        # Determine filename
        filename = run.id+"_"+run.name+"_it_"+run.iteration + ".zip"
        
        # Create a zip file of the folder
        zip_path = zip_folder(folder_path, filename)
        
        return {
            "file_path": zip_path,
            "file_size": os.path.getsize(zip_path),
            "content_type": 'application/zip',
            "filename": filename
        }

