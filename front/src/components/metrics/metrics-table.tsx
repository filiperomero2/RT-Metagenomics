import { useFocusedRun } from "@/hooks/use-focused-run";
import { useMetrics } from "@/hooks/use-metrics";
import { cn } from "@/utils/cn";
import { Progress } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "../custom-accordion";

export function MetricsTable() {
  const focused = useFocusedRun();
  const { data, isPending } = useMetrics();
  const [show, setShow] = useState(false);
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current && data?.sampleMetrics) {
      setShow(!!data?.sampleMetrics);
      firstRender.current = false;
    }
  }, [data])

  return (
    <Accordion
      fitContent
      title="Metrics"
      show={show}
      stateIndicator={data ? "success" : "warning"}
      toggle={() => setShow(!show)}
      isLoading={isPending}
    >
      {data?.sampleMetrics && (
        <div className="grid grid-cols-2 gap-0.5 p-1 text-sm [--line-size:4px]">
          {focused?.samples.map((sample, sampleIndex) => {
            const metrics = data?.sampleMetrics[sample.name];
            const isOdd = sampleIndex % 2 === 0;

            if (!metrics) return null

            return (
              <div
                key={sample.id}
                className={cn(
                  "border-current/60 bg-current/4 flex flex-col overflow-clip border-2",
                  sampleIndex < 2 &&
                  (isOdd ? "rounded-tl-lg" : "rounded-tr-lg"),
                  sampleIndex > focused.samples.length - 3 &&
                  (isOdd ? "rounded-bl-lg" : "rounded-br-lg"),
                  sample.isNegativeControl ? "text-secondary" : "text-primary"
                )}
              >
                <div className="bg-current/10 text-current border-current/60 gap-1 border-b-2 p-0.5 text-center">
                  <p className="dark:text-content2-foreground pt-1 pb-2 text-2xl font-bold uppercase">
                    --- {sample.name} ---
                  </p>
                  <Progress
                    showValueLabel
                    size="lg"
                    classNames={{
                      track: "rounded-none",
                      labelWrapper: "px-1 dark:text-content2-foreground",
                      indicator: "bg-current rounded-none",
                    }}
                    label={`Identified Sequences: ${metrics?.nIdentifiedSequences ?? 0} of ${metrics?.nSequences ?? 0}`}
                    value={metrics?.nIdentifiedSequences ?? 0}
                    maxValue={metrics?.nSequences ?? 1}
                  />
                </div>
                <div className="m-3 mb-4 flex flex-col gap-2 [&:hover_>:not(:hover)]:scale-98 [&:hover_>:not(:hover)]:grayscale">
                  {metrics?.pathologies?.map((pathology) => (
                    <div
                      key={pathology.name}
                      className="grid cursor-pointer grid-cols-[1.5fr_auto_3fr] items-center justify-center transition"
                    >
                      <div className="dark:bg-current/15 bg-content1   border-current/60 flex flex-col justify-center rounded-md border-3 p-1.5 py-2">
                        <p className="font-semibold text-content1-foreground ">{pathology.name}</p>
                        <Progress
                          showValueLabel
                          size="sm"
                          classNames={{
                            indicator: "bg-current/60",
                            labelWrapper: "text-content1-foreground",
                            label: "text-xs",
                            value: "text-xs",
                          }}
                          label={`${pathology.nReads} of ${metrics.nSequences}`}
                          value={pathology.nReads}
                          maxValue={metrics.nSequences}
                        />
                      </div>
                      <div className="bg-current/60 h-(--line-size) w-4 self-center" />
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
                                    "bg-current/60 h-full w-(--line-size)",
                                    (pathogenIndex === 0 ||
                                      pathogenIndex ===
                                      pathology.pathogens.length - 1) &&
                                    "h-[calc(50%+var(--line-size)/2)]",
                                  )}
                                />
                              )}
                              <div className="bg-current/60 h-(--line-size) w-3 self-center" />
                            </div>
                            <div className="dark:bg-current/15 border-current/60 bg-content1 my-0.5 flex w-full flex-col gap-1 rounded-md border-3 p-1.5 py-2">
                              <p className="font-semibold text-content1-foreground">
                                {pathogen.pathogen}
                              </p>

                              <Progress
                                showValueLabel
                                size="sm"
                                classNames={{
                                  indicator: "bg-current/60",
                                  labelWrapper: "text-content1-foreground",
                                  label: "text-xs",
                                  value: "text-xs",
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
