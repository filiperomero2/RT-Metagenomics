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
import { ChartNoAxesColumnIncreasing } from "lucide-react";
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
  const [log, setLog] = useState(false);

  const focused = useFocusedRun();

  const processedDataSets = dataSets.map((dts) => ({
    ...dts,
    data: dts.data.map((v) => (log && v > 0 ? Number(Math.log10(v).toFixed(2)) : v)),
  }));

  const flatData = processedDataSets.flatMap((dts) => dts.data);
  const lowerNumber = Math.min(...flatData);
  const higherNumber = Math.max(...flatData);

  function generateBackgroundColor(value: number) {
    const ratio = (value - lowerNumber) / (higherNumber - lowerNumber);
    return colorScale(ratio);
  }

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
            {processedDataSets.map((dts, dtsIndex) => (
              <div key={dts.dataSetTitle} className="flex w-full gap-1">
                {dts.data.map((cell, cellIndex) => (
                  <TooltipHero
                    showArrow
                    placement="right"
                    key={`${dtsIndex}-${cellIndex}`}
                    className="bg-background/90 rounded-sm p-0"
                    classNames={{
                      arrow: "bg-background/90",
                    }}
                    content={
                      <div className="flex flex-col gap-1 px-2 py-1">
                        <span>{focused?.samples[cellIndex].name}</span>

                        <span className="flex items-center gap-1">
                          <div
                            className="h-3 w-3 rounded-xs border"
                            style={{
                              backgroundColor: generateBackgroundColor(cell),
                            }}
                          />
                          <span>
                            {dts.dataSetTitle}: {cell}
                          </span>
                        </span>
                      </div>
                    }
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
                <span key={s.id} className="text-medium flex-1 text-center">
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

  const processedDataSets = dataSets.map((dts) => ({
    ...dts,
    data: dts.data.map((v) => (log ? Number(Math.log10(v).toFixed(2)) : v)),
  }));

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
    </Accordion>
  );
}
