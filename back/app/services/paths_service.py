from entities.run import Run


class PathsService:
    def __init__(self):
        pass

    def get_output_path(self, run: Run) -> str:
        return f"{run.parameters.path}/../{run.id}_output_{run.name}"

    def get_config_path(self, run: Run) -> str:
        return f"{self.get_output_path(run)}/config.yaml"

    def get_krona_path(self, run: Run) -> str:
        return f"{self.get_output_path(run)}/{run.id}_{run.name}/metagenomics/taxonomic_assignments"