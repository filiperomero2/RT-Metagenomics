from pathlib import Path
from typing import Callable, Dict, Optional

from config import config
from dto.settings_config import Kraken2DatabaseConfig
from entities.config import Config
from entities.enum import ConfigType
from repositories.config_repository import ConfigRepository

from services.paths_service import PathsService
from services.viralunity_databases_service import ViralUnityDatabasesService


class DatabaseSetupService:
    """
    Helper service to install/update external databases used by RT-Metagenomics.
    """

    def __init__(
        self,
        config_repository: ConfigRepository,
        paths_service: PathsService,
    ) -> None:
        self.config_repository = config_repository
        self.vu_databases_service = ViralUnityDatabasesService(
            paths_service.get_external_databases_dir()
        )

    def get_kraken2_base_dir(self) -> Path:
        kraken2_dir = self.vu_databases_service.parent_dir / "kraken2"
        kraken2_dir.mkdir(parents=True, exist_ok=True)
        return kraken2_dir

    def list_kraken2_databases(self) -> list[Kraken2DatabaseConfig]:
        kraken2_dir = self.get_kraken2_base_dir()
        stored_databases = list(self.config_repository.list_config(ConfigType.KRAKEN2))
        stored_by_value = {item.value: item for item in stored_databases if item.value}
        candidates: dict[str, Kraken2DatabaseConfig] = {}

        if (kraken2_dir / "hash.k2d").is_file():
            stored_root = stored_by_value.get(str(kraken2_dir))
            candidates[str(kraken2_dir)] = Kraken2DatabaseConfig(
                name=kraken2_dir.name,
                value=str(kraken2_dir),
                is_default=stored_root.is_default if stored_root else False,
            )

        for database_dir in kraken2_dir.iterdir():
            if not database_dir.is_dir():
                continue
            if not (database_dir / "hash.k2d").is_file():
                continue
            stored_child = stored_by_value.get(str(database_dir))
            candidates[str(database_dir)] = Kraken2DatabaseConfig(
                name=database_dir.name,
                value=str(database_dir),
                is_default=stored_child.is_default if stored_child else False,
            )

        for saved in stored_databases:
            if (
                saved.value
                and Path(saved.value).exists()
                and saved.value not in candidates
            ):
                candidates[saved.value] = Kraken2DatabaseConfig(
                    name=saved.name,
                    value=saved.value,
                    is_default=saved.is_default,
                )

        return sorted(candidates.values(), key=lambda database: database.name.lower())

    def install_kraken2_database(self, url: str | None) -> Dict[str, str]:
        """
        Download and extract the viral Kraken2 database, making it available
        to the application.

        Returns:
            Dict with the final database directory path and status.
        """
        archive_url = url if url else config.kraken2.default_download_url
        kraken2_path = self.vu_databases_service.install_kraken2(
            url=archive_url,
            force=True,
        )

        has_default = any(
            database.is_default
            for database in self.config_repository.list_config(ConfigType.KRAKEN2)
        )
        self.config_repository.save_config(
            Config(
                name=kraken2_path.name,
                type=ConfigType.KRAKEN2,
                value=str(kraken2_path),
                is_default=not has_default,
            )
        )

        return {
            "status": "installed",
            "name": kraken2_path.name,
            "kraken2Database": str(kraken2_path),
        }

    def update_krona_database(self) -> Dict[str, str]:
        """
        Update the Krona taxonomy database by running ktUpdateTaxonomy.sh.

        Returns:
            Dict with the database directory path (best guess) and status.
        """
        krona_dir = self.vu_databases_service.install_krona(force=True)
        self.config_repository.save_config(
            Config(
                name="databases.krona",
                type=ConfigType.KRONA,
                value=str(krona_dir),
            )
        )

        return {
            "status": "updated",
            "kronaDatabase": str(krona_dir),
        }

    def install_taxdump(self, url: str | None) -> Dict[str, str]:
        """
        Download and extract the NCBI taxdump, making it available
        to the application for Kraken2/Diamond taxonomic summaries in metagenomics.

        Args:
            url: Optional custom URL to download from. If None, uses the default.

        Returns:
            Dict with the taxdump directory path and status.
        """
        archive_url = url if url else config.taxdump.default_download_url
        taxdump_dir = self.vu_databases_service.install_taxdump(
            url=archive_url,
            force=True,
        )

        # Persist with the exact config name used by settings
        # Must match SETTINGS_CONFIG_NAMES[ConfigType.TAXDUMP] in settings_service.py
        self.config_repository.save_config(
            Config(
                name="databases.taxdump",
                type=ConfigType.TAXDUMP,
                value=str(taxdump_dir),
            )
        )

        return {
            "status": "installed",
            "taxdump": str(taxdump_dir),
        }

    def bootstrap_all_databases(
        self,
        on_progress: Optional[Callable[[int, int, str], None]] = None,
    ) -> Dict[str, str]:
        paths = self.vu_databases_service.install_all(
            force=False, on_progress=on_progress
        )

        has_default = any(
            database.is_default
            for database in self.config_repository.list_config(ConfigType.KRAKEN2)
        )
        self.config_repository.save_config(
            Config(
                name="kraken2",
                type=ConfigType.KRAKEN2,
                value=paths["kraken2_database"],
                is_default=not has_default,
            )
        )
        self.config_repository.save_config(
            Config(
                name="databases.krona",
                type=ConfigType.KRONA,
                value=paths["krona_database"],
            )
        )
        self.config_repository.save_config(
            Config(
                name="databases.taxdump",
                type=ConfigType.TAXDUMP,
                value=paths["taxdump"],
            )
        )
        self.config_repository.save_config(
            Config(
                name="databases.diamond",
                type=ConfigType.DIAMOND,
                value=paths["diamond_database"],
            )
        )
        self.config_repository.save_config(
            Config(
                name="databases.diamond_taxids",
                type=ConfigType.DIAMOND_TAXIDS,
                value=paths["taxids"],
            )
        )
        self.config_repository.save_config(
            Config(
                name="databases.deacon",
                type=ConfigType.DEACON,
                value=paths["deacon_index"],
            )
        )

        return {
            "status": "installed",
            **paths,
        }
