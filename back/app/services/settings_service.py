import json

from dto.settings_config import SettingsConfig
from entities.config import Config
from entities.enum import ConfigType
from repositories.config_repository import ConfigRepository

APP_SETTINGS_CONFIG_NAME = "app_settings"
SETTINGS_CONFIG_NAMES = {
    ConfigType.POLLING_INTERVAL: "polling_interval",
    ConfigType.ITERATION_INTERVAL: "iteration_interval",
    ConfigType.KRONA_PATH: "databases.krona",
    ConfigType.KRAKEN2_PATH: "databases.kraken2",
    ConfigType.DIAMOND_TAXDUMP_PATH: "databases.diamond.taxdump",
    ConfigType.DIAMOND_ASSEMBLY_SUMMARY_PATH: "databases.diamond.assembly-summary",
    ConfigType.DIAMOND_TAXID_TO_FAMILY_PATH: "databases.diamond.taxid-to-family",
}


class SettingsService:
    def __init__(self, config_repository: ConfigRepository):
        self.config_repository = config_repository

    def get_settings(self) -> SettingsConfig:
        if self._has_split_settings():
            return self._build_settings_config()

        stored_config = self.config_repository.get_config_by_name(APP_SETTINGS_CONFIG_NAME)
        if not stored_config or not stored_config.value:
            return SettingsConfig()

        return SettingsConfig.model_validate(json.loads(stored_config.value))

    def save_settings(self, settings: SettingsConfig) -> SettingsConfig:
        values = {
            ConfigType.POLLING_INTERVAL: str(settings.polling_interval),
            ConfigType.ITERATION_INTERVAL: str(settings.iteration_interval),
            ConfigType.KRONA_PATH: settings.databases.krona,
            ConfigType.KRAKEN2_PATH: settings.databases.kraken2,
            ConfigType.DIAMOND_TAXDUMP_PATH: settings.databases.diamond.taxdump,
            ConfigType.DIAMOND_ASSEMBLY_SUMMARY_PATH: settings.databases.diamond.assembly_summary,
            ConfigType.DIAMOND_TAXID_TO_FAMILY_PATH: settings.databases.diamond.taxid_to_family,
        }

        for config_type, value in values.items():
            self.config_repository.save_config(
                Config(
                    name=SETTINGS_CONFIG_NAMES[config_type],
                    type=config_type,
                    value=value,
                )
            )

        self.config_repository.find_and_remove(APP_SETTINGS_CONFIG_NAME)
        return settings

    def _has_split_settings(self) -> bool:
        return any(
            self.config_repository.get_config_by_name(config_name)
            for config_name in SETTINGS_CONFIG_NAMES.values()
        )

    def _build_settings_config(self) -> SettingsConfig:
        settings = SettingsConfig()

        polling_interval = self.config_repository.get_config_by_name("polling_interval")
        if polling_interval and polling_interval.value:
            settings.polling_interval = int(polling_interval.value)

        iteration_interval = self.config_repository.get_config_by_name("iteration_interval")
        if iteration_interval and iteration_interval.value:
            settings.iteration_interval = int(iteration_interval.value)

        krona_path = self.config_repository.get_config_by_name("databases.krona")
        if krona_path and krona_path.value:
            settings.databases.krona = krona_path.value

        kraken2_path = self.config_repository.get_config_by_name("databases.kraken2")
        if kraken2_path and kraken2_path.value:
            settings.databases.kraken2 = kraken2_path.value

        diamond_taxdump_path = self.config_repository.get_config_by_name(
            "databases.diamond.taxdump"
        )
        if diamond_taxdump_path and diamond_taxdump_path.value:
            settings.databases.diamond.taxdump = diamond_taxdump_path.value

        diamond_assembly_summary_path = self.config_repository.get_config_by_name(
            "databases.diamond.assembly-summary"
        )
        if diamond_assembly_summary_path and diamond_assembly_summary_path.value:
            settings.databases.diamond.assembly_summary = diamond_assembly_summary_path.value

        diamond_taxid_to_family_path = self.config_repository.get_config_by_name(
            "databases.diamond.taxid-to-family"
        )
        if diamond_taxid_to_family_path and diamond_taxid_to_family_path.value:
            settings.databases.diamond.taxid_to_family = diamond_taxid_to_family_path.value

        return settings
