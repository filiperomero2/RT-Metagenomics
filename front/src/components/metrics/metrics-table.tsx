import { useFocusedRun } from "@/hooks/use-focused-run";
import { cn } from "@/utils/cn";
import { Progress } from "@heroui/react";
import { useEffect, useState } from "react";
import { Accordion } from "../custom-accordion";
import { MetricsTableProps } from "./types";
import { motion } from "framer-motion";

export function MetricsTable({
  sampleMetrics,
  summaryMetrics,
}: MetricsTableProps) {
  const focused = useFocusedRun();
  const [show, setShow] = useState(!!sampleMetrics);

  useEffect(() => {
    setShow(!!sampleMetrics);
  }, [sampleMetrics]);

  return (
    <Accordion
      fitContent
      title="Metrics"
      show={show}
      toggle={() => setShow(!show)}
    >
      {sampleMetrics && (
        <div className="grid grid-cols-2 gap-0.5 p-1 text-sm [--line-size:4px]">
          {focused?.samples.map((sample, sampleIndex) => {
            const metrics = sampleMetrics[sample.name];
            const isOdd = sampleIndex % 2 === 0;

            return (
              <div
                key={sample.id}
                className={cn(
                  "border-primary-900/60 flex flex-col overflow-clip border-2",
                  sampleIndex < 2 &&
                    (isOdd ? "rounded-tl-lg" : "rounded-tr-lg"),
                  sampleIndex > focused.samples.length - 3 &&
                    (isOdd ? "rounded-bl-lg" : "rounded-br-lg"),
                )}
              >
                <div className="bg-primary-900/10 dark:text-content2-foreground text-primary-900 border-primary-900/60 gap-1 border-b-2 p-0.5 text-center">
                  <p className="dark:text-content2-foreground pt-1 pb-2 text-2xl font-bold uppercase">
                    --- {sample.name} ---
                  </p>
                  <Progress
                    showValueLabel
                    size="lg"
                    classNames={{
                      track: "rounded-none",
                      labelWrapper: "px-1",
                      indicator: "bg-primary-900 rounded-none",
                    }}
                    label={`Identified Sequences: ${metrics.nIdentifiedSequences} of ${metrics.nSequences}`}
                    value={metrics.nIdentifiedSequences}
                    maxValue={metrics.nSequences}
                  />
                </div>
                <div className="flex flex-col gap-2 p-3 pb-4 [&:hover_>:not(:hover)]:scale-98 [&:hover_>:not(:hover)]:blur-[2px] [&:hover_>:not(:hover)]:grayscale">
                  {metrics.pathologies.map((pathology) => (
                    <div
                      key={pathology.name}
                      className="grid grid-cols-[1.5fr_auto_3fr] items-center justify-center transition cursor-pointer"
                    >
                      <div className="dark:bg-primary-900/15 bg-content1 border-primary-900/60 flex flex-col justify-center rounded-md border-3 p-2 py-3">
                        <p className="font-semibold">{pathology.name}</p>
                        <Progress
                          showValueLabel
                          size="sm"
                          classNames={{
                            indicator: "bg-primary-900/60",
                          }}
                          label={`${pathology.nReads} of ${metrics.nSequences}`}
                          value={pathology.nReads}
                          maxValue={metrics.nSequences}
                        />
                      </div>
                      <div className="bg-primary-900/60 h-(--line-size) w-4 self-center" />
                      <div className="flex h-full flex-col">
                        {pathology.pathogens.map((pathogen, pathogenIndex) => (
                          <div
                            key={pathogen.pathogen}
                            className="flex h-full w-full"
                          >
                            <div
                              className={cn(
                                "flex h-full items-center",
                                pathogenIndex === 0 && "items-end",
                                pathogenIndex ===
                                  pathology.pathogens.length - 1 &&
                                  "items-start",
                              )}
                            >
                              {pathology.pathogens.length > 1 && (
                                <div
                                  className={cn(
                                    "bg-primary-900/60 h-full w-(--line-size)",
                                    (pathogenIndex === 0 ||
                                      pathogenIndex ===
                                        pathology.pathogens.length - 1) &&
                                      "h-[calc(50%+var(--line-size)/2)]",
                                  )}
                                />
                              )}
                              <div className="bg-primary-900/60 h-(--line-size) w-3 self-center" />
                            </div>
                            <div className="dark:bg-primary-900/15 border-primary-900/60 text-content1-foreground bg-content1 my-0.5 flex w-full flex-col gap-1 rounded-md border-3 p-2">
                              <p className="font-semibold">
                                {pathogen.pathogen}
                              </p>

                              <Progress
                                showValueLabel
                                size="sm"
                                classNames={{
                                  indicator: "bg-primary-900/60",
                                }}
                                label={`${pathogen.nReads} of ${metrics.nSequences}`}
                                value={pathogen.nReads}
                                maxValue={metrics.nSequences}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Accordion>
  );
}
