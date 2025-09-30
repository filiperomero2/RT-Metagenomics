export interface Metrics {
  summaryMetrics: SummaryMetric[];
  sampleMetrics: SampleMetrics;
  viralDatasets: Dataset[];
  familyDatasets: Dataset[];
}

export interface SummaryMetric {
  sample: string;
  taxon: string;
  nReadsRooted: number;
}

export type SampleMetrics = Record<string, SampleMetric>;

export interface SampleMetric {
  nSequences: number;
  nIdentifiedSequences: number;
  percentage_of_identified_sequences: number;
  pathologies: Pathology[];
}

export interface Pathology {
  name: string;
  nReads: number;
  pathogens: Pathogen[];
}

export interface Pathogen {
  pathogen: string;
  nReads: number;
}

export interface Dataset {
  dataSetTitle: string;
  data: number[];
}
