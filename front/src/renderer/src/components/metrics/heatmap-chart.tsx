import { Accordion } from "@/components/custom-accordion";
import { useFocusedRun } from "@/hooks/use-focused-run";
import { viridisColorGenerator } from "@/utils/color-generator";
import { Tooltip as TooltipHero } from "@heroui/react";
import interpolate from "color-interpolate";
import { ChartProps } from "./types";

const colors = [
  viridisColorGenerator(1),
  viridisColorGenerator(0.5),
  viridisColorGenerator(0.1),
];
const colorScale = interpolate(colors);

export function HeatMapChart({ title, dataSets, isLoading, log }: ChartProps) {
  const focused = useFocusedRun();
  const processedDataSets = dataSets?.map((dts) => ({
    ...dts,
    data: dts.data.map((v) =>
      log && v > 0 ? Number(Math.log10(v).toFixed(2)) : v,
    ),
  }));
  const flatData = processedDataSets?.flatMap((dts) => dts.data) ?? [];
  const lowerNumber = Math.min(...flatData);
  const higherNumber = Math.max(...flatData);

  function generateBackgroundColor(value: number) {
    const ratio = (value - lowerNumber) / (higherNumber - lowerNumber);
    return colorScale(ratio);
  }
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
          <div className="flex w-full">
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

              <div className="flex w-full flex-col items-center gap-1 ">
                {processedDataSets.map((dts, dtsIndex) => (
                  <div key={dts.dataSetTitle} className="flex w-full gap-1">
                    {dts.data.map((cell, cellIndex) => (
                      <TooltipHero key={`${dtsIndex}-${cellIndex}`} delay={0}>
                        <TooltipHero.Trigger
                          className="h-full min-h-[1rem] w-full flex-1 rounded-xs bg-current transition hover:brightness-90"
                          style={{
                            color: generateBackgroundColor(cell),
                          }}
                        ></TooltipHero.Trigger>
                        <TooltipHero.Content
                          showArrow
                          placement="right"
                          className="bg-background/90 rounded-sm p-0"
                        >
                          <TooltipHero.Arrow  />
                          <div className="flex flex-col gap-1 px-2 py-1">
                            <span>{focused?.samples[cellIndex].name}</span>

                            <span className="flex items-center gap-1">
                              <div
                                className="h-3 w-3 rounded-xs border"
                                style={{
                                  backgroundColor:
                                    generateBackgroundColor(cell),
                                }}
                              />
                              <span>
                                {dts.dataSetTitle}: {cell}
                              </span>
                            </span>
                          </div>
                        </TooltipHero.Content>
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
        </div>
      )}
    </Accordion>
  );
}
