import { BarChart } from "@/mainview/components/metrics/bar-chart";
import { HeatMapChart } from "@/mainview/components/metrics/heatmap-chart";
import { MetricsTable } from "@/mainview/components/metrics/metrics-table";
import { useMetrics } from "@/mainview/hooks/use-metrics";
import { generateFamilyDataSets, generateViralDataSets } from "@/mainview/utils/generate-datasets";
import { useMemo } from "react";

export function RunMetrics() {
  const { data, isPending } = useMetrics();
  const familyDataSets = useMemo(() => generateFamilyDataSets(data?.sampleMetrics), [data?.sampleMetrics]);
  const viralDataSets = useMemo(() => generateViralDataSets(data?.sampleMetrics), [data?.sampleMetrics]);

  return (
    <>
      <MetricsTable />
      <BarChart
        title="Total reads per sample (Classified vs Unclassified)"
        dataSets={viralDataSets}
        isLoading={isPending}
      />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={familyDataSets}
        isLoading={isPending}
      />
      <HeatMapChart
        title="HeatMap"
        dataSets={familyDataSets}
        isLoading={isPending}
      />
    </>
  );
}
