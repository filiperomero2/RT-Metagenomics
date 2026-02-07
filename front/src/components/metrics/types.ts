import { Dataset, SampleMetrics, SummaryMetric } from "@/types/metrics";

export interface ChartProps {
  title: string;
  legend?: string;
  dataSets?: Dataset[];
  isLoading?: boolean;
}

export interface MetricsTableProps {
  sampleMetrics?: SampleMetrics;
  summaryMetrics?: SummaryMetric[]
}
