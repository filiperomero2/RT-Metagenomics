import { useFocusedRun } from "@/hooks/use-focused-run";
import { useMetrics } from "@/hooks/use-metrics";
import { cn } from "@/utils/cn";
import { Label, ProgressBar } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "../custom-accordion";

export function MetricsTable() {
  const focused = useFocusedRun();
  const { data, isPending } = useMetrics();
  const [show, setShow] = useState(false);
  const firstRender = useRef(true);

  const hasValues = Object.values(data?.sampleMetrics || {}).filter(
    Boolean,
  ).length > 0;

  useEffect(() => {
    if (firstRender.current && hasValues) {
      setShow(!!data?.sampleMetrics);
      firstRender.current = false;
    }
  }, [data]);

  return (
    <Accordion
      fitContent
      className={cn((!hasValues || isPending) && "h-[83dvh]")}
      title="Metrics"
      show={show}
      stateIndicator={hasValues ? "success" : "warning"}
      toggle={() => setShow(!show)}
      isLoading={!hasValues || isPending}
    >
      {data?.sampleMetrics && (
        <div className="grid grid-cols-2 gap-0.5 p-1 text-sm [--line-size:4px]">
          {focused?.samples.map((sample, sampleIndex) => {
            const metrics = data?.sampleMetrics[sample.name];
            const isOdd = sampleIndex % 2 === 0;

            if (!metrics) return null;

            return (
              <div
                key={sample.id}
                className={cn(
                  "flex flex-col overflow-clip border-2 border-current/60 bg-current/4",
                  sampleIndex < 2 &&
                    (isOdd ? "rounded-tl-lg" : "rounded-tr-lg"),
                  sampleIndex > focused.samples.length - 3 &&
                    (isOdd ? "rounded-bl-lg" : "rounded-br-lg"),
                  sample.isNegativeControl ? "text-default" : "text-accent",
                )}
              >
                <div className="gap-1 border-b-2 border-current/60 bg-current/10 p-0.5 text-center text-current">
                  <p className="pt-1 pb-2 text-2xl font-bold uppercase dark:text-foreground">
                    --- {sample.name} ---
                  </p>
                  <ProgressBar
                    size="lg"
                    value={metrics?.nIdentifiedSequences ?? 0}
                    maxValue={metrics?.nSequences ?? 1}
                  >
                    <Label className="px-1 dark:text-foreground">
                      Identified Sequences: {metrics?.nIdentifiedSequences ?? 0} of {" "}
                      {metrics?.nSequences ?? 0}
                    </Label>
                    <ProgressBar.Output className="px-1 text-xs dark:text-foreground" />
                    <ProgressBar.Track className="rounded-none">
                      <ProgressBar.Fill className="rounded-none bg-current" />
                    </ProgressBar.Track>
                  </ProgressBar>
                </div>
                <div className="m-3 mb-4 flex flex-col gap-2 [&:hover_>:not(:hover)]:scale-98 [&:hover_>:not(:hover)]:grayscale">
                  {metrics?.pathologies?.map((pathology) => (
                    <div
                      key={pathology.name}
                      className="grid cursor-pointer grid-cols-[1.5fr_auto_3fr] items-center justify-center transition"
                    >
                      <div className="bg-surface flex flex-col justify-center rounded-md border-[3px] border-current/60 p-1.5 py-2 dark:bg-current/15">
                        <p className="font-semibold text-foreground">
                          {pathology.name}
                        </p>
                        <ProgressBar
                          size="sm"
                          value={pathology.nReads}
                          maxValue={metrics.nSequences}
                        >
                          <Label className="text-xs text-foreground">
                            {pathology.nReads} of {metrics.nSequences}
                          </Label>
                          <ProgressBar.Output className="text-xs text-foreground" />
                          <ProgressBar.Track>
                            <ProgressBar.Fill className="bg-current/60" />
                          </ProgressBar.Track>
                        </ProgressBar>
                      </div>
                      <div className="h-(--line-size) w-4 self-center bg-current/60" />
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
                                    "h-full w-(--line-size) bg-current/60",
                                    (pathogenIndex === 0 ||
                                      pathogenIndex ===
                                        pathology.pathogens.length - 1) &&
                                      "h-[calc(50%+var(--line-size)/2)]",
                                  )}
                                />
                              )}
                              <div className="h-(--line-size) w-3 self-center bg-current/60" />
                            </div>
                            <div className="bg-surface my-0.5 flex w-full flex-col gap-1 rounded-md border-[3px] border-current/60 p-1.5 py-2 dark:bg-current/15">
                              <p className="font-semibold text-foreground">
                                {pathogen.pathogen}
                              </p>

                              <ProgressBar
                                size="sm"
                                value={pathogen.nReads}
                                maxValue={metrics.nSequences}
                              >
                                <Label className="text-xs text-foreground">
                                  {pathogen.nReads} of {metrics.nSequences}
                                </Label>
                                <ProgressBar.Output className="text-xs text-foreground" />
                                <ProgressBar.Track>
                                  <ProgressBar.Fill className="bg-current/60" />
                                </ProgressBar.Track>
                              </ProgressBar>
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
