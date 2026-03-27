import { MetaGenomicRun, Sample } from "@/mainview/types/meta-genomic-run";

export const queryKeys = {
  getAllMetaGenomics: () => ["list-meta-genomics"],
  getMetaGenomic: (sample: Sample) => ["get-meta-genomic", sample],
  getCharts: (focused?: MetaGenomicRun) => ["charts", focused],
};
