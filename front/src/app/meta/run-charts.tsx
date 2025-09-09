import { useFocusedRun } from "@/hooks/use-focused-run";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  LogarithmicScale,
  ChartData,
  ChartDataset,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { faker } from "@faker-js/faker";
import { useMemo, useState } from "react";
import { Switch } from "@heroui/react";
import { Accordion } from "@/components/custom-accordion";
import { Exo_2 } from "next/font/google";

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

export function RunCharts() {
  const focused = useFocusedRun();
  const viralData = [
    {
      dataSetTitle: "Viral",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Non-viral",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
  ];

  const familyData = [
    {
      dataSetTitle: "Coronaviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Pneumoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Ornithoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Baculoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Poxviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Retroviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
    {
      dataSetTitle: "Steitoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 1000 })) ??
        [],
    },
  ];

  return (
    <>
      <BarChart
        title="Total reads per sample (Viral vs Non-viral)"
        dataSets={viralData}
      />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={familyData}
      />
    </>
  );
}

interface ChartProps {
  title: string;
  legend?: string;
  dataSets: { dataSetTitle: string; data: number[] }[];
}

export function BarChart({ title, dataSets, legend }: ChartProps) {
  const [show, setShow] = useState(true);
  const [log, setLog] = useState(false);

  const focused = useFocusedRun();

  return (
    <Accordion
      show={show}
      toggle={() => setShow(!show)}
      title={title}
      actions={[
        {
          label: "Toggle logarithmic",
          icon: <Switch size="sm" isReadOnly inert isSelected={log} />,
          onPress: () => setLog(!log),
        },
      ]}
    >
      <div className="flex h-full items-center justify-center">
        <div className="flex h-[85vh] w-full items-center justify-center p-4">
          <Bar
            data={{
              labels: focused?.samples
                // .sort((a, b) => a.id - b.id)
                .map((s) => `${s.id} - ${s.name} `),

              datasets: dataSets.map((d) => ({
                label: d.dataSetTitle,
                data: d.data,
                
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
                  type: log ? "logarithmic" : "linear",
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
                colors: {
                  enabled: true,
                  // forceOverride: true,
                },
              },
            }}
          />
        </div>
      </div>
    </Accordion>
  );
}
