import { Dataset, SampleMetrics, SummaryMetrics } from "@/mainview/types/metrics";

export interface ChartProps {
  title: string;
  legend?: string;
  dataSets?: Dataset[];
  isLoading?: boolean;
}

export interface MetricsTableProps {
  sampleMetrics?: SampleMetrics;
  summaryMetrics?: SummaryMetrics[];
}
