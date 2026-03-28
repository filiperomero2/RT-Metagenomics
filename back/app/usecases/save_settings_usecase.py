from dto.settings_config import SettingsConfig
from services.settings_service import SettingsService


class SaveSettingsUseCase:
    def __init__(self, settings_service: SettingsService):
        self.settings_service = settings_service

    def execute(self, settings: SettingsConfig):
        return self.settings_service.save_settings(settings)
