import { MetaGenomicRun, Sample } from "@/types/meta-genomic-run";

export const queryKeys = {
  getAllMetaGenomics: () => ["list-meta-genomics"],
  getMetaGenomic: (sample: Sample) => ["get-meta-genomic", sample],
  getCharts: (focused?: MetaGenomicRun) => ["charts", focused],
  getSettings: () => ["settings"],
};
