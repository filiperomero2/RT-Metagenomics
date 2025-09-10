import { Accordion } from "@/components/custom-accordion";
import { useFocusedRun } from "@/hooks/use-focused-run";
import { faker, he } from "@faker-js/faker";
import { Switch, Tooltip as TooltipHero } from "@heroui/react";
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
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Non-viral",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
  ];

  const familyData = [
    {
      dataSetTitle: "Coronaviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Pneumoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Ornithoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Baculoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Poxviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Retroviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
    {
      dataSetTitle: "Steitoviridae",
      data:
        focused?.samples.map(() => faker.number.int({ min: 0, max: 300 })) ??
        [],
    },
  ];

  return (
    <>
      <HeatMapChart title="HeatMap" dataSets={familyData} />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={familyData}
      />
      <BarChart
        title="Total reads per sample (Viral vs Non-viral)"
        dataSets={viralData}
      />
    </>
  );
}

interface ChartProps {
  title: string;
  legend?: string;
  dataSets: { dataSetTitle: string; data: number[] }[];
}

export function HeatMapChart({ title, dataSets }: ChartProps) {
  const [show, setShow] = useState(true);

  const focused = useFocusedRun();

  const flatData = dataSets.flatMap((dts) => dts.data);
  const lowerNumber = Math.min(...flatData);
  const higherNumber = Math.max(...flatData);

  function generateBackgroundColor(value: number) {
    const percentage = (value - lowerNumber) / (higherNumber - lowerNumber);
    const lightness = 80 - percentage * 55;
    return `hsl(186.67deg 79.75% ${lightness}%)`;
  }

  return (
    <Accordion show={show} toggle={() => setShow(!show)} title={title}>
      <div className="flex h-full w-full">
        <div className="m-auto flex w-11/12 py-4">
          <div className="mr-5 mb-8 flex flex-col items-center">
            <span>{higherNumber}</span>
            <div
              className="my-3 w-5 flex-1 rounded"
              style={{
                background: `linear-gradient(to top, ${generateBackgroundColor(lowerNumber)}, ${generateBackgroundColor(higherNumber)})`,
              }}
            />
            <span>{lowerNumber}</span>
          </div>

          <div className="flex w-full flex-col items-center gap-1">
            {dataSets.map((dts) => (
              <div key={dts.dataSetTitle} className="flex w-full gap-1">
                {dts.data.map((cell, index) => (
                  <TooltipHero
                    showArrow
                    // placement="right"
                    key={index}
                    content={<span className="px-2 py-1">{cell}</span>}
                  >
                    <span
                      className="h-10 flex-1 rounded-xs bg-current transition hover:brightness-90"
                      style={{
                        color: generateBackgroundColor(cell),
                      }}
                    ></span>
                  </TooltipHero>
                ))}
                <span className="w-32 p-1">{dts.dataSetTitle}</span>
              </div>
            ))}

            <div className="flex w-full gap-1">
              {focused?.samples.map((s) => (
                <span className="text-medium flex-1 text-center capitalize">
                  {s.name}
                </span>
              ))}
              <span className="w-32 p-1" />
            </div>
          </div>
        </div>
      </div>
    </Accordion>
  );
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
              labels: focused?.samples.map((s) => s.name),
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
