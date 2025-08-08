import os
import hashlib
import csv
from entities.run_parameters import RunParameters
from config import config

class FileHashCalculatorService:
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
