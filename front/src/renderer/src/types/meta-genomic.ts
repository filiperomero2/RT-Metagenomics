export interface MetaGenomic {
  dataType: "illumina" | "nanopore";
  samples: { name: string; barcode: string; isNegativeControl?: boolean }[];
  runName: string;
  path: string;
  trim: number;
  threads: number;
  threadsTotal: number;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  minimumReadLength: number;
  kraken2Database: string;
  kronaDatabase: string;
  diamondDatabase: string;
  taxdump: string;
  taxids?: string | null;
  runDiamondReads: boolean;
  runDiamondContigs: boolean;
  runDenovoAssembly: boolean;
}
