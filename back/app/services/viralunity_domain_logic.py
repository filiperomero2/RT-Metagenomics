import os
import hashlib
import csv
from entities.run_parameters import RunParameters
from config import config

class ViralUnityDomainLogic:
    def get_hash_of_task(self, task: RunParameters) -> str:
        sample_hash = ""
        with open(task.sampleSheetFilePath, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                sample_file_1 = row[1] if len(row) > 1 else None
                sample_file_2 = row[2] if len(row) > 2 else None
                if sample_file_1 is not None and os.path.exists(sample_file_1):
                    with open(sample_file_1, 'rb') as f:
                        sample_hash += hashlib.sha256(f.read()).hexdigest()
                if sample_file_2 is not None and sample_file_2 and os.path.exists(sample_file_2):
                    with open(sample_file_2, 'rb') as f:
                        sample_hash += hashlib.sha256(f.read()).hexdigest()
        task_hash = hashlib.sha256(sample_hash.encode()).hexdigest()
        return task_hash

    def prepare_metagenomics_params(self, metagenomics_parameters: RunParameters) -> dict:
        return {
            "data_type": metagenomics_parameters.dataType.value,
            "sample_sheet": metagenomics_parameters.sampleSheetFilePath,
            "config_file": metagenomics_parameters.outputDir + "/config.yaml",
            "run_name": f"{metagenomics_parameters.id}_{metagenomics_parameters.runName}",
            "kraken2_database": metagenomics_parameters.kraken2DatabasePath,
            "krona_database": metagenomics_parameters.kronaDatabasePath,
            "adapters": metagenomics_parameters.adaptersPath,
            "threads": metagenomics_parameters.threads,
            "threads_total": metagenomics_parameters.threadsTotal,
            "output": metagenomics_parameters.outputDir,
            "remove_human_reads": metagenomics_parameters.removeHumanReads,
            "remove_unclassified_reads": metagenomics_parameters.removeUnclassifiedReads,
            "create_config_only": False,
            "minimum_read_length": config.service.default_minimum_read_length,
            "trim": metagenomics_parameters.trim,
        } 