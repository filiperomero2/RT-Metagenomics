import { MetricsTable } from "@/components/metrics/metrics-table";
import { RunCharts } from "../metrics/run-charts";
import { useMetrics } from "@/hooks/use-metrics";
import {
  generateFamilyDataSets,
  generateViralDataSets,
} from "@/utils/generate-datasets";
import { useMemo } from "react";

export function RunMetrics() {
  const { data, isPending } = useMetrics();
  const familyDataSets = useMemo(
    () => generateFamilyDataSets(data?.sampleMetrics),
    [data?.sampleMetrics],
  );
  const viralDataSets = useMemo(
    () => generateViralDataSets(data?.sampleMetrics),
    [data?.sampleMetrics],
  );

  return (
    <>
      <MetricsTable />
      <RunCharts />
    </>
  );
}
