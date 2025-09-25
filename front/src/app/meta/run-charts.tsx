import { Accordion } from "@/components/custom-accordion";
import { useFocusedRun } from "@/hooks/use-focused-run";
import { api } from "@/lib/axios";
import {
  infernoColorGenerator,
  viridisColorGenerator,
} from "@/utils/color-generator";
import { queryKeys } from "@/utils/query-keys-factory";
import { faker } from "@faker-js/faker";
import { Switch, Tooltip as TooltipHero } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
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
  const { data } = useQuery({
    queryKey: queryKeys.getCharts(focused),
    queryFn: async () => {
      const response = await api.get(`/v1/metagenomics/${focused?.id}/charts`);
      return response.data;
    },
  });

  if (!data) return null;

  return (
    <>
      <BarChart
        title="Total reads per sample (Classified vs Unclassified)"
        dataSets={data.viralDatasets}
      />
      <BarChart
        title="Reads per family per sample (absolute)"
        legend="Family"
        dataSets={data.familyDatasets}
      />
      <HeatMapChart title="HeatMap" dataSets={data.familyDatasets} />
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
                backgroundColor: viridisColorGenerator(
                  i / (dataSets.length - 1),
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
              },
            }}
          />
        </div>
      </div>
    </Accordion>
  );
}
