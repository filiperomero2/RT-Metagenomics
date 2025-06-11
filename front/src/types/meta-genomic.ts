export interface MetaGenomic {
  dataType: "illumina" | "nanopore";
  sampleSheetFilePath: string;
  outputDir: string;
  runName: string;
  trim: number;
  threads: number;
  threadsTotal: number;
  kraken2DatabasePath: string;
  kronaDatabasePath: string;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  adaptersPath: string;
  minimumReadLength: number;
}
