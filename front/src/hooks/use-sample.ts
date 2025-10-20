import { api } from "@/lib/axios";
import { Sample } from "@/types/meta-genomic-run";
import { queryKeys } from "@/utils/query-keys-factory";
import { useQuery } from "@tanstack/react-query";

export function useSample(sample: Sample) {
  return useQuery({
    queryKey: queryKeys.getMetaGenomic(sample),
    refetchInterval: 30000,
    queryFn: async () => {
      const response = await api.get(
        `v1/metagenomics/${sample.runId}/${sample.id}/result`,
      );
      return response.data;
    },
  });
}
