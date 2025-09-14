import logging
import os
import csv


logger = logging.getLogger('uvicorn.error')


class MetricsService:
    def __init__(self):
        pass

    def get_summary_metrics(self, summary_metrics_file):
        if not os.path.exists(summary_metrics_file):
            return None
        
        with open(summary_metrics_file, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                print(row)
                
    def get_sample_metrics(self, sample_metrics_file):
        if not os.path.exists(sample_metrics_file):
            return None
        
        with open(sample_metrics_file, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                print(row)