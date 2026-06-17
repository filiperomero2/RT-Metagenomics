from services.database_setup_service import DatabaseSetupService

class UpdateKronaDbUseCase:
    def __init__(self, database_setup_service: DatabaseSetupService):
        self.database_setup_service = database_setup_service

    def execute(self):
        return self.database_setup_service.update_krona_database()