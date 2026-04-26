export interface MetaGenomicRun {
  id: number;
  name: string;
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  iteration: number;
  errorMessage: string;
  executionHash: string;
  executionHashTime: Date;
  createdAt: Date;
  updatedAt: Date;
  samples: Sample[];
  parameters: Parameters;
  metrics: RunMetrics;
}

export interface RunMetrics {
  nTotalReads: number;
  nTotalIdentifiedReads: number;
}

export interface Parameters {
  dataType: string;
  threads: number;
  threadsTotal: number;
  kraken2Database: string;
  kronaDatabase: string;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  minimumReadLength: number;
  adapters?: string | null;
  trimHead?: number | null;
  trimTail?: number | null;
  runDenovoAssembly?: boolean;
  runKraken2Reads?: boolean;
  runKraken2Contigs?: boolean;
  runDiamondReads?: boolean;
  runDiamondContigs?: boolean;
  hostReference?: string | null;
  deaconIndex?: string | null;
  taxdump?: string | null;
  diamondDatabase?: string | null;
  taxids?: string | null;
  bleedFraction?: number;
  negativePThreshold?: number;
  minimumHitGroup?: number;
  runPolishRacon?: boolean;
  runPolishMedaka?: boolean;
  medakaModel?: string | null;
  runReferenceAssembly?: boolean;
  referenceAssemblyMethod?: string | null;
  referenceAssemblySource?: string | null;
  viralGenomes?: string | null;
  viralTaxids?: string | null;
}

export interface Sample {
  id: number;
  name: string;
  runId: number;
  isNegativeControl?: boolean;
}
