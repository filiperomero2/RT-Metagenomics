export type MetaGenomic = {
  id: number;
  runName: string;
  dataType: string;
  minimumReadLength: string;
  removeHumanReads: boolean;
  removeUnclassifiedReads: boolean;
  threads: string;
  threadsTotal: string;
  trim: string;
  done?: boolean;
}
