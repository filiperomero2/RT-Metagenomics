from dto.settings_config import Kraken2DatabaseConfig, SettingsConfig
from entities.config import Config
from entities.enum import ConfigType
from repositories.config_repository import ConfigRepository
from services.database_setup_service import DatabaseSetupService

APP_SETTINGS_CONFIG_NAME = "app_settings"

SETTINGS_CONFIG_NAMES = {
    ConfigType.POLLING_INTERVAL: "polling_interval",
    ConfigType.ITERATION_INTERVAL: "iteration_interval",
    ConfigType.KRONA: "databases.krona",
    ConfigType.KRAKEN2: "databases.kraken2",
    ConfigType.DIAMOND_TAXDUMP: "databases.diamond.taxdump",
    ConfigType.DIAMOND_TAXIDS: "databases.diamond.taxids",
    ConfigType.VIRAL_GENOMES: "databases.viral.genomes",
    ConfigType.VIRAL_TAXIDS: "databases.viral.taxids",
    ConfigType.HOST_REFERENCE: "databases.deacon.host_reference",
    ConfigType.DEACON_INDEX: "databases.deacon.index",
}


class SettingsService:
    def __init__(
        self,
        config_repository: ConfigRepository,
        database_setup_service: DatabaseSetupService,
    ):
        self.config_repository = config_repository
        self.database_setup_service = database_setup_service

    def get_settings(self) -> SettingsConfig:
        return self._build_settings_config()

    def save_settings(self, settings: SettingsConfig) -> SettingsConfig:
        kraken2_databases = self._normalize_kraken2_databases(
            settings.databases.kraken2,
        )
        values = {
            ConfigType.POLLING_INTERVAL: str(settings.polling_interval),
            ConfigType.ITERATION_INTERVAL: str(settings.iteration_interval),
            ConfigType.KRONA: settings.databases.krona,
            ConfigType.DIAMOND_TAXDUMP: settings.databases.diamond.taxdump,
            ConfigType.DIAMOND_TAXIDS: settings.databases.diamond.taxids,
            ConfigType.VIRAL_GENOMES: settings.databases.viral.genomes,
            ConfigType.VIRAL_TAXIDS: settings.databases.viral.taxids,
            ConfigType.HOST_REFERENCE: settings.databases.deacon.host_reference,
            ConfigType.DEACON_INDEX: settings.databases.deacon.index,
        }

        for config_type, value in values.items():
            self.config_repository.save_config(
                Config(
                    name=SETTINGS_CONFIG_NAMES[config_type],
                    type=config_type,
                    value=value,
                )
            )

        kraken2_names = set()
        for database in kraken2_databases:
            kraken2_names.add(database.name)
            self.config_repository.save_config(
                Config(
                    name=database.name,
                    type=ConfigType.KRAKEN2,
                    value=database.value,
                    is_default=database.is_default,
                )
            )

        self.config_repository.remove_configs_by_type_not_in(
            ConfigType.KRAKEN2,
            kraken2_names,
        )

        settings.databases.kraken2 = kraken2_databases
        return settings

    def _build_settings_config(self) -> SettingsConfig:
        settings = SettingsConfig()

        polling_interval = self.config_repository.get_config_by_type(ConfigType.POLLING_INTERVAL)
        if polling_interval and polling_interval.value:
            settings.polling_interval = int(polling_interval.value)

        iteration_interval = self.config_repository.get_config_by_type(ConfigType.ITERATION_INTERVAL)
        if iteration_interval and iteration_interval.value:
            settings.iteration_interval = int(iteration_interval.value)

        krona_path = self.config_repository.get_config_by_type(ConfigType.KRONA)
        if krona_path and krona_path.value:
            settings.databases.krona = krona_path.value

        kraken2_configs = {
            config.value: config
            for config in self.config_repository.list_config(ConfigType.KRAKEN2)
            if config.value
        }
        legacy_default_kraken2 = self.config_repository.get_config_by_name(
            SETTINGS_CONFIG_NAMES[ConfigType.KRAKEN2],
        )
        settings.databases.kraken2 = self._normalize_kraken2_databases(
            [
                Kraken2DatabaseConfig(
                    name=database.name,
                    value=database.value,
                    is_default=(
                        kraken2_configs[database.value].is_default
                        if database.value in kraken2_configs
                        else False
                    ),
                )
                for database in self.database_setup_service.list_kraken2_databases()
            ],
            legacy_default_value=legacy_default_kraken2.value if legacy_default_kraken2 else None,
        )

        diamond_taxdump_path = self.config_repository.get_config_by_type(ConfigType.DIAMOND_TAXDUMP)
        if diamond_taxdump_path and diamond_taxdump_path.value:
            settings.databases.diamond.taxdump = diamond_taxdump_path.value

        diamond_assembly_summary_path = self.config_repository.get_config_by_type(ConfigType.DIAMOND_ASSEMBLY_SUMMARY)
        if diamond_assembly_summary_path and diamond_assembly_summary_path.value:
            settings.databases.diamond.assembly_summary = diamond_assembly_summary_path.value

        diamond_taxid_to_family_path = self.config_repository.get_config_by_type(ConfigType.DIAMOND_TAXID_TO_FAMILY)
        if diamond_taxid_to_family_path and diamond_taxid_to_family_path.value:
            settings.databases.diamond.taxid_to_family = diamond_taxid_to_family_path.value

        viral_genomes_path = self.config_repository.get_config_by_type(
            ConfigType.VIRAL_GENOMES
        )
        if viral_genomes_path and viral_genomes_path.value:
            settings.databases.viral.genomes = viral_genomes_path.value

        viral_taxids_path = self.config_repository.get_config_by_type(
            ConfigType.VIRAL_TAXIDS
        )
        if viral_taxids_path and viral_taxids_path.value:
            settings.databases.viral.taxids = viral_taxids_path.value

        host_reference_path = self.config_repository.get_config_by_type(
            ConfigType.HOST_REFERENCE
        )
        if host_reference_path and host_reference_path.value:
            settings.databases.deacon.host_reference = host_reference_path.value

        deacon_index_path = self.config_repository.get_config_by_type(
            ConfigType.DEACON_INDEX
        )
        if deacon_index_path and deacon_index_path.value:
            settings.databases.deacon.index = deacon_index_path.value

        return settings

    def _normalize_kraken2_databases(
        self,
        databases: list[Kraken2DatabaseConfig],
        legacy_default_value: str | None = None,
    ) -> list[Kraken2DatabaseConfig]:
        normalized_databases: list[Kraken2DatabaseConfig] = []
        seen_values: set[str] = set()

        for database in databases:
            if not database.value or database.value in seen_values:
                continue

            normalized_databases.append(
                Kraken2DatabaseConfig(
                    name=database.name,
                    value=database.value,
                    is_default=database.is_default,
                )
            )
            seen_values.add(database.value)

        if not normalized_databases:
            return []

        if legacy_default_value:
            has_default = any(database.is_default for database in normalized_databases)
            if not has_default:
                normalized_databases = [
                    Kraken2DatabaseConfig(
                        name=database.name,
                        value=database.value,
                        is_default=database.value == legacy_default_value,
                    )
                    for database in normalized_databases
                ]

        if not any(database.is_default for database in normalized_databases):
            first_database = normalized_databases[0]
            normalized_databases[0] = Kraken2DatabaseConfig(
                name=first_database.name,
                value=first_database.value,
                is_default=True,
            )

        default_value = next(
            (
                database.value
                for database in normalized_databases
                if database.is_default
            ),
            normalized_databases[0].value,
        )

        return [
            Kraken2DatabaseConfig(
                name=database.name,
                value=database.value,
                is_default=database.value == default_value,
            )
            for database in normalized_databases
        ]
