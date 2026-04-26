export interface MetaGenomicSample {
  name: string;
  barcode: string;
  isNegativeControl: boolean;
}

export interface MetaGenomic {
  dataType: "illumina" | "nanopore";
  samples: MetaGenomicSample[];
  runName: string;
  path: string;
  threads: number;
  threadsTotal: number;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  minimumReadLength: number;
  kraken2Database: string;
  kronaDatabase: string;

  adapters?: string | null;
  trimHead?: number | null;
  trimTail?: number | null;

  runDenovoAssembly: boolean;
  runKraken2Reads: boolean;
  runKraken2Contigs: boolean;
  runDiamondReads: boolean;
  runDiamondContigs: boolean;

  hostReference?: string | null;
  deaconIndex?: string | null;
  taxdump?: string | null;
  diamondDatabase?: string | null;
  taxids?: string | null;

  bleedFraction: number;
  negativePThreshold: number;
  minimumHitGroup: number;

  runPolishRacon: boolean;
  runPolishMedaka: boolean;
  medakaModel?: string | null;

  runReferenceAssembly: boolean;
  referenceAssemblyMethod?: string | null;
  referenceAssemblySource?: string | null;
  viralGenomes?: string | null;
  viralTaxids?: string | null;
}
