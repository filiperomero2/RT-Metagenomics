import logging
import os
import csv
from config import config



logger = logging.getLogger('uvicorn.error')


class MetricsService:
    def __init__(self):
        pass

    def get_summary_metrics(self, run_id, run_name):
        summary_file_path = f"{config.output_dir}/{run_id}_{run_name}/metagenomics/metagenomics_summary.txt"
        if not os.path.exists(summary_file_path):
            return None
        
        summary_metrics = []
        with open(summary_file_path, 'r') as file:
            reader = csv.reader(file)
            next(reader) # skip the header
            for row in reader:
                # Exmaple of row /tmp/rtmeta/output/6_teste_1/metagenomics/taxonomic_assignments/results/sample-dengue.report.txt,79.58,22281,0,1092787,9771,F,11118,Coronaviridae
                summary_metrics.append({ "sample": self.extract_sample_name(row[0]), "taxon": row[8], "n_reads_rooted": row[2] })
                
        return summary_metrics
    
    def extract_sample_name(self, file_name):
        # The content of the file_name is something like /tmp/rtmeta/output/6_teste_1/metagenomics/taxonomic_assignments/results/sample-dengue.report.txt
        # The expected return is dengue
        return file_name.split("/")[-1].split(".")[0].replace("sample-", "")
                
    def get_sample_metrics(self, run_id, run_name, sample_name):
        sample_file_path = f"{config.output_dir}/{run_id}_{run_name}/metagenomics/taxonomic_assignments/results/sample-{sample_name}.output.krona.txt"
        report_file_path = f"{config.output_dir}/{run_id}_{run_name}/metagenomics/taxonomic_assignments/results/sample-{sample_name}.report.txt"
        if not os.path.exists(sample_file_path):
            return None
        
        sample_metrics = {}
        
        with open(sample_file_path, 'r') as file:
            reader = csv.reader(file,delimiter="\t")
            n_sequences = 0
            n_identified_sequences = 0
            for row in reader:
                n_sequences +=1
                if row[1] != "0":
                    n_identified_sequences +=1
            sample_metrics["n_sequences"] = n_sequences
            sample_metrics["n_identified_sequences"] = n_identified_sequences
            sample_metrics["percentage_of_identified_sequences"] = n_identified_sequences / n_sequences
        
        patologie_threshold = 0.01
        sample_metrics["patologies"] = {}
        with open(report_file_path, 'r') as file:
            reader = csv.reader(file,delimiter="\t")
            previous_row = next(reader)
            for row in reader:
                if(float(row[0]) < patologie_threshold):
                    continue
                current_identetation = self.count_report_padding(row[7])
                previous_identetation = self.count_report_padding(previous_row[7])
                if(previous_identetation > current_identetation):
                    sample_metrics["patologies"][previous_row[7].lstrip()] = previous_row[0]
                previous_row = row
            sample_metrics["patologies"][previous_row[7].lstrip()] = previous_row[0] # add last row
        return sample_metrics
                
    def count_report_padding(self, string):
        return len(string) - len(string.lstrip())