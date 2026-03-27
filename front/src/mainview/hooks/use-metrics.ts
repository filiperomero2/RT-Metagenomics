import { api } from "@/mainview/lib/axios";
import { queryKeys } from "@/utils/query-keys-factory";
import { useQuery } from "@tanstack/react-query";
import { useFocusedRun } from "./use-focused-run";
import { Metrics } from "@/types/metrics";

export function useMetrics() {
  const focused = useFocusedRun();

  return useQuery({
    enabled: !!focused?.id,
    queryKey: queryKeys.getCharts(focused),
    refetchInterval: 10000,
    queryFn: async () => {
      const response = await api.get<Metrics>(
        `/v1/metagenomics/${focused?.id}/metrics`,
      );
      return response.data;
    },
  });
}
