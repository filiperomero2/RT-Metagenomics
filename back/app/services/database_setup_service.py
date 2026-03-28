import subprocess
from pathlib import Path
from typing import Dict

from config import config
from dto.settings_config import Kraken2DatabaseConfig
from entities.config import Config
from entities.enum import ConfigType
from repositories.config_repository import ConfigRepository
import shutil

class DatabaseSetupService:
    """
    Helper service to install/update external databases used by RT-Metagenomics.
    """

    def __init__(self, config_repository: ConfigRepository) -> None:
        self.config_repository = config_repository
        # Base directory for tool databases (under the service user's home directory)
        self.base_dir = Path.home() / ".rt-metagenomics"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_kraken2_base_dir(self) -> Path:
        kraken2_dir = self.base_dir / config.kraken2.default_path
        kraken2_dir.mkdir(parents=True, exist_ok=True)
        return kraken2_dir

    def list_kraken2_databases(self) -> list[Kraken2DatabaseConfig]:
        kraken2_dir = self.get_kraken2_base_dir()
        stored_databases = {
            config.value: config
            for config in self.config_repository.list_config(ConfigType.KRAKEN2)
        }

        databases = [
            Kraken2DatabaseConfig(
                name=database_dir.name,
                value=str(database_dir),
                is_default=(
                    stored_databases[str(database_dir)].is_default
                    if str(database_dir) in stored_databases
                    else False
                ),
            )
            for database_dir in kraken2_dir.iterdir()
            if database_dir.is_dir()
        ]

        return sorted(databases, key=lambda database: database.name.lower())

    def install_kraken2_database(self, url: str | None) -> Dict[str, str]:
        """
        Download and extract the viral Kraken2 database, making it available
        to the application.

        Returns:
            Dict with the final database directory path and status.
        """
        # Remove 

        kraken2_dir = self.get_kraken2_base_dir()

        archive_url = url if url else config.kraken2.default_download_url
        archive_name = None
        try: 
            archive_name = archive_url.split("/")[-1]
            extract_folder_name = archive_name.split(".")[0]
        except Exception as _:
            archive_name = "k2"

        file_path = kraken2_dir / archive_name
        extract_path = kraken2_dir / extract_folder_name

        # Remove the directory and its contents if it is already present
        if extract_path.is_dir():
            shutil.rmtree(extract_path)
            extract_path.mkdir(parents=True, exist_ok=True)

        # Remove the file if it is already present
        if file_path.is_file():
            file_path.unlink()

        subprocess.run(
            ["wget", "-O", str(file_path), archive_url],
            check=True,
            cwd=str(kraken2_dir),
        )

        extract_path.mkdir(parents=True, exist_ok=True)
        # Extract the archive
        subprocess.run(
            ["tar", "-xzf", str(file_path)],
            check=True,
            cwd=str(extract_path),
        )

        has_default = any(
            database.is_default
            for database in self.config_repository.list_config(ConfigType.KRAKEN2)
        )
        self.config_repository.save_config(
            Config(
                name=extract_folder_name,
                type=ConfigType.KRAKEN2,
                value=str(extract_path),
                is_default=not has_default,
            )
        )

        return {
            "status": "installed",
            "name": extract_folder_name,
            "kraken2Database": str(extract_path),
        }

    def update_krona_database(self) -> Dict[str, str]:
        """
        Update the Krona taxonomy database by running ktUpdateTaxonomy.sh.

        Returns:
            Dict with the database directory path (best guess) and status.
        """
        krona_dir = self.base_dir / config.krona.default_path
        krona_dir.mkdir(parents=True, exist_ok=True)
        # Run the standard Krona update command. This assumes that the FastAPI
        # process is running inside the conda environment where Krona is installed
        # and ktUpdateTaxonomy.sh is available on PATH.
        subprocess.run(
            ["ktUpdateTaxonomy.sh", krona_dir],
            check=True,
        )

        self.config_repository.save_config(Config(name='Krona Taxonomy', type=ConfigType.KRONA, value=str(krona_dir)))

        return {
            "status": "updated",
            "kronaDatabase": krona_dir,
        }
