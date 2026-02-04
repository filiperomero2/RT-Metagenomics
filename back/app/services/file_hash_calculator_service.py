import os
import hashlib
import csv
from entities.run_parameters import RunParameters
from config import config

class FileHashCalculatorService:
    def get_hash_of_task(self, task: RunParameters) -> str:
        sample_hash = ""
        # Get hash of all files in task.path and then get the hash of this hash
        input_dir = task.path
        for file in self.list_files_recursively(input_dir):
            with open(file, 'rb') as f:
                sample_hash += hashlib.sha256(f.read()).hexdigest()
        task_hash = hashlib.sha256(sample_hash.encode()).hexdigest()
        return task_hash

    def list_files_recursively(self, directory: str) -> list[str]:
        files = []
        try:
            for file in os.listdir(directory):
                if os.path.isdir(os.path.join(directory, file)):
                    files.extend(self.list_files_recursively(os.path.join(directory, file)))
                else:
                    files.append(os.path.join(directory, file))
            return files
        except Exception as e:
            return []