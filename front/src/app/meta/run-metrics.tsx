import { BarChart } from "@/components/metrics/bar-chart";
import { HeatMapChart } from "@/components/metrics/heatmap-chart";
import { MetricsTable } from "@/components/metrics/metrics-table";
import { useFocusedRun } from "@/hooks/use-focused-run";
import { api } from "@/lib/axios";
import { queryKeys } from "@/utils/query-keys-factory";
import { useQuery } from "@tanstack/react-query";

export function RunMetrics() {
  const focused = useFocusedRun();
  const { data } = useQuery({
    queryKey: queryKeys.getCharts(focused),
    queryFn: async () => {
      const response = await api.get(`/v1/metagenomics/${focused?.id}/charts`);
      return response.data;
    },
  });

  if (!data) return null;
  return (
    <>
      <MetricsTable />
      <BarChart
        title="Total reads per sample (Classified vs Unclassified)"
        dataSets={data.viralDatasets}
      />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={data.familyDatasets}
      />
      <HeatMapChart title="HeatMap" dataSets={data.familyDatasets} />
    </>
  );
}
