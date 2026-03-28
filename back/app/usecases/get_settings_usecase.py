from services.settings_service import SettingsService


class GetSettingsUseCase:
    def __init__(self, settings_service: SettingsService):
        self.settings_service = settings_service

    def execute(self):
        return self.settings_service.get_settings()
