export interface MetaGenomicRun {
  id: number;
  name: string;
  state: "pending" | "running" | "completed" | "failed" | "canceled";
  iteration: number;
  errorMessage: string;
  executionHash: string;
  createdAt: Date;
  updatedAt: Date;
  samples: Sample[];
  parameters: Parameters;
}

export interface Parameters {
  dataType: string;
  trim: number;
  threads: number;
  threadsTotal: number;
  kraken2Database: string;
  kronaDatabase: string;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  minimumReadLength: number;
}

export interface Sample {
  id: number;
  name: string;
  runId: number;
}
