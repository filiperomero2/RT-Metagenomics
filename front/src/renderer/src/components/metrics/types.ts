import { Dataset, SampleMetrics, SummaryMetrics } from "@/types/metrics";

export interface ChartProps {
  title: string;
  legend?: string;
  dataSets?: Dataset[];
  isLoading?: boolean;
  log?: boolean
}

export interface MetricsTableProps {
  sampleMetrics?: SampleMetrics;
  summaryMetrics?: SummaryMetrics[];
}
