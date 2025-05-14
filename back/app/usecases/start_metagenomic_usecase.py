from models import MetagenomicsParameters


class StartMetagenomicsUseCase:
    def __init__(self, viralunity_service):
        self.viralunity_service = viralunity_service

    def execute(self, metagenomics_parameters: MetagenomicsParameters):
        print(f"Starting metagenomics with parameters: {metagenomics_parameters}")
        result = self.viralunity_service.start_metagenomics(metagenomics_parameters)

        return result