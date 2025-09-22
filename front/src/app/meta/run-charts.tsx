import { Accordion } from "@/components/custom-accordion";
import { useFocusedRun } from "@/hooks/use-focused-run";
import {
  infernoColorGenerator,
  magmaColorGenerator,
  viridisColorGenerator,
} from "@/utils/color-generator";
import { faker } from "@faker-js/faker";
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
import interpolate from "color-interpolate";
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
      <BarChart
        title="Total reads per sample (Classified vs Unclassified)"
        dataSets={viralData}
      />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={familyData}
      />
      <HeatMapChart title="HeatMap" dataSets={familyData} />
    </>
  );
}

interface ChartProps {
  title: string;
  legend?: string;
  dataSets: { dataSetTitle: string; data: number[] }[];
}

const colors = [
  infernoColorGenerator(1),
  infernoColorGenerator(0.5),
  infernoColorGenerator(0),
];
const colorScale = interpolate(colors);

export function HeatMapChart({ title, dataSets }: ChartProps) {
  const [show, setShow] = useState(true);

  const focused = useFocusedRun();

  const flatData = dataSets.flatMap((dts) => dts.data);
  const lowerNumber = Math.min(...flatData);
  const higherNumber = Math.max(...flatData);

  function generateBackgroundColor(value: number) {
    const ratio = (value - lowerNumber) / (higherNumber - lowerNumber);
    return colorScale(ratio);
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
                background: `linear-gradient(to top, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
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
                <span className="text-medium flex-1 text-center">{s.name}</span>
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
              datasets: dataSets.map((d, i) => ({
                label: d.dataSetTitle,
                data: d.data,
                backgroundColor: viridisColorGenerator((i / (dataSets.length-1))),
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
