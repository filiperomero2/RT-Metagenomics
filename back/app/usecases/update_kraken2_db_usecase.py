from services.database_setup_service import DatabaseSetupService

class UpdateKraken2DbUseCase:
    def __init__(self, database_setup_service: DatabaseSetupService):
        self.database_setup_service = database_setup_service

    def execute(self, url: str | None):
        return self.database_setup_service.install_kraken2_database(url)
