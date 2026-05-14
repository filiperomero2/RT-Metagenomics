import logging
import os
import csv
import random
from typing import List, Dict, Optional, Any, TypedDict
from services.paths_service import PathsService
from entities.run import Run
from config import config

logger = logging.getLogger('uvicorn.error')


class SequenceMetrics(TypedDict):
    """Type definition for sequence metrics dictionary."""
    nSequences: int
    nIdentifiedSequences: int
    percentageOfIdentifiedSequences: float


class Pathogen(TypedDict):
    """Type definition for pathogen information."""
    pathogen: str
    nReads: int


class Pathology(TypedDict):
    """Type definition for pathology family information."""
    name: str
    nReads: int
    pathogens: List[Pathogen]


class SampleMetrics(TypedDict):
    """Type definition for sample metrics dictionary."""
    nSequences: int
    nIdentifiedSequences: int
    percentageOfIdentifiedSequences: float
    pathologies: List[Pathology]


class MetricsService:
    """Service for processing metagenomics metrics and sample data."""
    def __init__(self, paths_service: PathsService):
        """Initialize the MetricsService."""
        self.paths_service = paths_service
    
    # Constants for better maintainability
    TAXONOMIC_CATEGORIES = ["U", "R", "D", "K", "P", "C", "O", "F", "G", "S"]
    FAMILY_CATEGORY = "F"
    SAMPLE_PREFIX = "sample-"
    
    def get_sample_file_path_from_sample_name(self, run: Run, sample_name: str) -> str:
        return self.paths_service.get_kraken2_reads_krona_txt_path(run, sample_name)

    def get_sample_report_file_path_from_sample_name(self, run: Run, sample_name: str) -> str:
        return self.paths_service.get_kraken2_reads_report_path(run, sample_name)

    def get_summary_metrics(self, run: Run) -> Dict[str, Any]:
        """
        Extract summary metrics from the metagenomics summary file.
        
        Args:
            run_id: The run identifier
            run_name: The run name
            
        Returns:
            List of summary metrics dictionaries or None if file doesn't exist
        """
        samples = [self.get_sample_file_path_from_sample_name(run, sample.name) for sample in run.samples]
        sample_summary_metric = {}
        for sample_file_path in samples:
            sample_summary_metric[sample_file_path] = self._process_sequence_metrics(sample_file_path)

        nTotalReads = sum([sample_summary_metric[sample]["nSequences"] for sample in sample_summary_metric if sample_summary_metric[sample] is not None])
        nTotalIdentifiedReads = sum([sample_summary_metric[sample]["nIdentifiedSequences"] for sample in sample_summary_metric if sample_summary_metric[sample] is not None])

        percentageOfIdentifiedReads = nTotalIdentifiedReads / nTotalReads if nTotalReads > 0 else 0.0
        summary_metrics = {
            "nTotalReads": nTotalReads,
            "nTotalIdentifiedReads": nTotalIdentifiedReads,
            "percentageOfIdentifiedReads": percentageOfIdentifiedReads,
            "meanTimeOfAnalysis": run.totalElapsedTimeOfAnalysisExecutionSeconds/run.iteration if run.iteration > 0 else 0.0,
            "lastAnalysisTime": run.lastElapsedTimeOfAnalysisExecutionSeconds,
            "iteration": run.iteration,
            "executionHashTime": run.executionHashTime,
        }   
        
        return summary_metrics
    
    def extract_sample_name(self, file_name: str) -> str:
        """
        Extract sample name from file path.
        
        Args:
            file_name: Full file path containing sample name
            
        Returns:
            Extracted sample name (e.g., 'dengue' from 'sample-dengue.report.txt')
        """
        # e.g. .../sample-dengue.output.krona.txt or .../sample-dengue.report.txt
        filename = file_name.split("/")[-1]
        base = filename.split(".")[0]
        return base.replace(self.SAMPLE_PREFIX, "")
                
    def get_sample_metrics(self, run: Run, sample_name: str) -> Optional[Dict[str, SampleMetrics]]:
        """
        Get comprehensive metrics for a specific sample.

        Args:
            run: The run entity
            sample_name: The sample name

        Returns:
            Dictionary containing sample metrics or None if files don't exist
        """
        sample_file_path = self.get_sample_file_path_from_sample_name(run, sample_name)
        report_file_path = self.get_sample_report_file_path_from_sample_name(run, sample_name)

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

    def _process_sequence_metrics(self, sample_file_path: str) -> Optional[SequenceMetrics]:
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
                    "nSequences": n_sequences,
                    "nIdentifiedSequences": n_identified_sequences,
                    "percentageOfIdentifiedSequences": percentage_identified
                }
        except FileNotFoundError:
            logger.debug(f"File not found for {sample_file_path}")
            return None
        except (IOError, IndexError, ValueError) as e:
            logger.error(f"Error processing sequence metrics from {sample_file_path}: {e}")
            return None

    def _process_pathology_data(self, report_file_path: str) -> List[Pathology]:
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
                            "nReads": int(previous_row[2])
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
                                "nReads": int(row[1]),
                                "pathogens": []
                            }
                    
                    previous_row = row
                
                # Add the last pathogen and family
                if current_family is not None:
                    current_family["pathogens"].append({
                        "pathogen": previous_row[7].lstrip(),
                        "nReads": int(previous_row[2])
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