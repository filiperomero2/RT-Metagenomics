import logging
import os
import csv
from typing import List, Dict, Optional, Any
from config import config

logger = logging.getLogger('uvicorn.error')


class MetricsService:
    """Service for processing metagenomics metrics and sample data."""
    
    # Constants for better maintainability
    TAXONOMIC_CATEGORIES = ["U", "R", "D", "K", "P", "C", "O", "F", "G", "S"]
    FAMILY_CATEGORY = "F"
    SAMPLE_PREFIX = "sample-"
    
    def __init__(self):
        """Initialize the MetricsService."""
        pass

    def get_summary_metrics(self, run_id: str, run_name: str) -> Optional[List[Dict[str, Any]]]:
        """
        Extract summary metrics from the metagenomics summary file.
        
        Args:
            run_id: The run identifier
            run_name: The run name
            
        Returns:
            List of summary metrics dictionaries or None if file doesn't exist
        """
        summary_file_path = f"{config.output_dir}/{run_id}_{run_name}/metagenomics/metagenomics_summary.txt"
        if not os.path.exists(summary_file_path):
            logger.warning(f"Summary file not found: {summary_file_path}")
            return None
        
        summary_metrics = []
        try:
            with open(summary_file_path, 'r') as file:
                reader = csv.reader(file)
                next(reader)  # skip the header
                for row in reader:
                    # Example of row: /tmp/rtmeta/output/6_teste_1/metagenomics/taxonomic_assignments/results/sample-dengue.report.txt,79.58,22281,0,1092787,9771,F,11118,Coronaviridae
                    summary_metrics.append({
                        "sample": self.extract_sample_name(row[0]),
                        "taxon": row[8],
                        "n_reads_rooted": int(row[2])
                    })
        except (IOError, IndexError, ValueError) as e:
            logger.error(f"Error reading summary file {summary_file_path}: {e}")
            return None
                
        return summary_metrics
    
    def extract_sample_name(self, file_name: str) -> str:
        """
        Extract sample name from file path.
        
        Args:
            file_name: Full file path containing sample name
            
        Returns:
            Extracted sample name (e.g., 'dengue' from 'sample-dengue.report.txt')
        """
        # Example: /tmp/rtmeta/output/6_teste_1/metagenomics/taxonomic_assignments/results/sample-dengue.report.txt
        # Expected return: dengue
        filename = file_name.split("/")[-1]
        sample_name = filename.split(".")[0]
        return sample_name.replace(self.SAMPLE_PREFIX, "")
                
    def get_sample_metrics(self, run_id: str, run_name: str, sample_name: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive metrics for a specific sample.
        
        Args:
            run_id: The run identifier
            run_name: The run name
            sample_name: The sample name
            
        Returns:
            Dictionary containing sample metrics or None if files don't exist
        """
        sample_file_path = f"{config.output_dir}/{run_id}_{run_name}/metagenomics/taxonomic_assignments/results/sample-{sample_name}.output.krona.txt"
        report_file_path = f"{config.output_dir}/{run_id}_{run_name}/metagenomics/taxonomic_assignments/results/sample-{sample_name}.report.txt"
        
        if not os.path.exists(sample_file_path):
            logger.warning(f"Sample file not found: {sample_file_path}")
            return None
        
        sample_metrics = {}
        
        # Process sequence identification metrics
        sequence_metrics = self._process_sequence_metrics(sample_file_path)
        if sequence_metrics is None:
            return None
        sample_metrics.update(sequence_metrics)
        
        # Process pathogen/pathology data
        if os.path.exists(report_file_path):
            pathologies = self._process_pathology_data(report_file_path)
            sample_metrics["pathologies"] = pathologies
        else:
            logger.warning(f"Report file not found: {report_file_path}")
            sample_metrics["pathologies"] = []
            
        return sample_metrics

    def _process_sequence_metrics(self, sample_file_path: str) -> Optional[Dict[str, Any]]:
        """Process sequence identification metrics from krona file."""
        try:
            with open(sample_file_path, 'r') as file:
                reader = csv.reader(file, delimiter="\t")
                n_sequences = 0
                n_identified_sequences = 0
                
                for row in reader:
                    n_sequences += 1
                    if len(row) > 1 and row[1] != "0":
                        n_identified_sequences += 1
                
                percentage_identified = n_identified_sequences / n_sequences if n_sequences > 0 else 0
                
                return {
                    "n_sequences": n_sequences,
                    "n_identified_sequences": n_identified_sequences,
                    "percentage_of_identified_sequences": percentage_identified
                }
        except (IOError, IndexError, ValueError) as e:
            logger.error(f"Error processing sequence metrics from {sample_file_path}: {e}")
            return None

    def _process_pathology_data(self, report_file_path: str) -> List[Dict[str, Any]]:
        """Process pathology data from report file."""
        pathologies = []
        family_index = self.TAXONOMIC_CATEGORIES.index(self.FAMILY_CATEGORY)
        
        try:
            with open(report_file_path, 'r') as file:
                reader = csv.reader(file, delimiter="\t")
                previous_row = next(reader)
                current_family = None
                
                for row in reader:
                    if len(row) < 8:
                        continue
                        
                    current_indentation = self._count_report_padding(row[7])
                    previous_indentation = self._count_report_padding(previous_row[7])
                    
                    # Add pathogen to current family if indentation indicates it's a leaf
                    if (previous_indentation >= current_indentation and 
                        current_family is not None):
                        current_family["pathogens"].append({
                            "pathogen": previous_row[7].lstrip(), 
                            "n_reads": int(previous_row[2])
                        })

                    # Check if we need to close current family and start new one
                    category = row[5]
                    if category[0] in self.TAXONOMIC_CATEGORIES:
                        category_index = self.TAXONOMIC_CATEGORIES.index(category[0])
                        
                        if category_index < family_index:
                            if current_family is not None:
                                pathologies.append(current_family)
                                current_family = None
                        elif category == self.FAMILY_CATEGORY:
                            if current_family is not None:
                                pathologies.append(current_family)
                            current_family = {
                                "name": row[7].lstrip(),
                                "n_reads": int(row[1]),
                                "pathogens": []
                            }
                    
                    previous_row = row
                
                # Add the last pathogen and family
                if current_family is not None:
                    current_family["pathogens"].append({
                        "pathogen": previous_row[7].lstrip(),
                        "n_reads": int(previous_row[2])
                    })
                    pathologies.append(current_family)
                    
        except (IOError, IndexError, ValueError) as e:
            logger.error(f"Error processing pathology data from {report_file_path}: {e}")
            return []
            
        return pathologies
                
    def _count_report_padding(self, string: str) -> int:
        """
        Count the number of leading spaces in a string to determine indentation level.
        
        Args:
            string: The string to analyze
            
        Returns:
            Number of leading spaces
        """
        return len(string) - len(string.lstrip())