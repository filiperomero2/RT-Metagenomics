import { BarChart } from "@/components/metrics/bar-chart";
import { HeatMapChart } from "@/components/metrics/heatmap-chart";
import { MetricsTable } from "@/components/metrics/metrics-table";
import { useMetrics } from "@/hooks/use-metrics";

export function RunMetrics() {
  const { data, isPending } = useMetrics();

  return (
    <>
      <MetricsTable />
      <BarChart
        title="Total reads per sample (Classified vs Unclassified)"
        dataSets={data?.viralDatasets}
        isLoading={isPending}
      />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={data?.familyDatasets}
        isLoading={isPending}
      />
      <HeatMapChart
        title="HeatMap"
        dataSets={data?.familyDatasets}
        isLoading={isPending}
      />
    </>
  );
}
