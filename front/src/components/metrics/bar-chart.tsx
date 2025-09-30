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
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { useEffect, useState } from "react";
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

export function BarChart({ title, dataSets, legend }: ChartProps) {
  const [show, setShow] = useState(!!dataSets);
  const [log, setLog] = useState(false);
  const focused = useFocusedRun();
  const processedDataSets = dataSets?.map((dts) => ({
    ...dts,
    data: dts.data.map((v) => (log ? Number(Math.log10(v).toFixed(2)) : v)),
  }));

  useEffect(() => {
    setShow(!!dataSets);
  }, [dataSets]);

  return (
    <Accordion
      show={show}
      toggle={() => setShow(!show)}
      title={title}
      actions={[
        {
          label: "Log10",
          active: log,
          icon: <ChartNoAxesColumnIncreasing />,
          onPress: () => setLog(!log),
        },
      ]}
    >
      {processedDataSets && (
        <div className="flex h-full items-center justify-center">
          <div className="flex h-[85vh] w-full items-center justify-center p-4">
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
                animation: { duration: 500 },
                aspectRatio: 19.5 / 9,
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
                    position: "right" as const,
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
