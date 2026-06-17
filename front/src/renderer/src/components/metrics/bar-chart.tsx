import { Accordion } from "@/components/custom-accordion";
import { useFocusedRun } from "@/hooks/use-focused-run";
import { viridisColorGenerator } from "@/utils/color-generator";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Colors,
  Legend,
  LinearScale,
  LogarithmicScale,
  Title,
  Tooltip,
} from "chart.js";
import { useState } from "react";
import { Bar } from "react-chartjs-2";
import { ChartProps } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
);

export function BarChart({
  title,
  dataSets,
  legend,
  isLoading,
  log,
}: ChartProps) {
  const focused = useFocusedRun();

  const processedDataSets = dataSets?.map((dts) => ({
    ...dts,
    data: dts.data.map((v) => (log ? Number(Math.log10(v).toFixed(2)) : v)),
  }));

  const hasValues =
    (dataSets
      ?.map((item) => item.data)
      .flat()
      .filter(Boolean).length ?? 0) > 0;

  return (
    <Accordion
      show
      title={title}
      className="h-full"
      isLoading={!hasValues || isLoading}
    >
      {processedDataSets && (
        <div className="flex h-full items-center justify-center">
          <div className="flex h-full w-full items-center justify-center p-4">
            <Bar
              data={{
                labels: focused?.samples.map((s) => s.name),
                datasets: processedDataSets.map((d, i) => ({
                  label: d.dataSetTitle,
                  data: d.data,
                  backgroundColor: viridisColorGenerator(
                    i / (processedDataSets.length - 1),
                  ),
                })),
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 500 },
                scales: {
                  x: {
                    stacked: true,
                    title: {
                      display: true,
                      text: "Samples",
                    },
                  },
                  y: {
                    stacked: true,
                    type: "linear",
                    title: {
                      display: true,
                      text: "Reads",
                    },
                  },
                },

                plugins: {
                  legend: {
                    position: "bottom" as const,
                    title: {
                      display: true,
                      text: legend,
                      position: "center",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </Accordion>
  );
}
