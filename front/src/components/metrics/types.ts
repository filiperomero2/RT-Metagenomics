import { Dataset, SampleMetrics, SummaryMetric } from "@/types/metrics";

export interface ChartProps {
  title: string;
  legend?: string;
  dataSets?: Dataset[];
}

export interface MetricsTableProps {
  sampleMetrics?: SampleMetrics;
  summaryMetrics?: SummaryMetric[]
}
