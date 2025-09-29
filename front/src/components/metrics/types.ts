export interface ChartProps {
  title: string;
  legend?: string;
  dataSets: { dataSetTitle: string; data: number[] }[];
}
