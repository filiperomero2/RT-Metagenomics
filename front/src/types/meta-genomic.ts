export interface MetaGenomic {
  dataType: "illumina" | "nanopore";
  samples: { name: string; barcode: string }[];
  runName: string;
  trim: number;
  threads: number;
  threadsTotal: number;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  minimumReadLength: number;
  kraken2Database: string;
  kronaDatabase: string;
}
