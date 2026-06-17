import { useFocusedRun } from "@/hooks/use-focused-run";
import { useMetrics } from "@/hooks/use-metrics";
import { cn } from "@/utils/cn";
import {
  Description,
  Label,
  ListBox,
  ProgressBar,
  ScrollShadow,
} from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { Accordion } from "../custom-accordion";

export function MetricsTable() {
  const focused = useFocusedRun();
  const { data, isPending } = useMetrics();
  const [show, setShow] = useState(false);
  const [selectedSampleName, setSelectedSampleName] = useState<string | null>(
    null,
  );
  const firstRender = useRef(true);

  const hasValues =
    Object.values(data?.sampleMetrics || {}).filter(Boolean).length > 0;

  useEffect(() => {
    if (firstRender.current && hasValues) {
      setShow(!!data?.sampleMetrics);
      firstRender.current = false;
    }
  }, [data]);

  useEffect(() => {
    if (!focused?.samples || !data?.sampleMetrics) return;

    const availableSamples = focused.samples.filter(
      (sample) => !!data.sampleMetrics[sample.name],
    );
    if (availableSamples.length === 0) {
      setSelectedSampleName(null);
      return;
    }

    const hasCurrentSelection = availableSamples.some(
      (sample) => sample.name === selectedSampleName,
    );
    if (!hasCurrentSelection) {
      setSelectedSampleName(availableSamples[0].name);
    }
  }, [focused?.samples, data?.sampleMetrics, selectedSampleName]);

  const selectedSample = focused?.samples.find(
    (sample) => sample.name === selectedSampleName,
  );
  const selectedMetrics = selectedSample
    ? data?.sampleMetrics?.[selectedSample.name]
    : undefined;

  return (
    <Accordion
      className="h-[70dvh] p-1 data-[fullscreen='true']:h-full"
      title="Metrics"
      show={show}
      stateIndicator={hasValues ? "success" : "warning"}
      toggle={() => setShow(!show)}
      isLoading={!hasValues || isPending}
    >
      {data?.sampleMetrics && (
        <div className="grid h-full min-h-0 grid-cols-[1fr_4fr] gap-2 p-1 text-sm [--line-size:4px]">
          <div className="bg-surface border-default/30 flex min-h-0 flex-col overflow-hidden rounded-xl border shadow-sm">
            <div className="border-default/20 bg-surface-secondary/35 text-muted border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase">
              Samples
            </div>
            <ScrollShadow className="min-h-0 flex-1 p-1" hideScrollBar>
              <ListBox
                aria-label="Samples"
                selectionMode="single"
                selectedKeys={
                  selectedSampleName ? new Set([selectedSampleName]) : new Set()
                }
                onSelectionChange={(keys) => {
                  if (keys === "all") return;
                  const [firstKey] = Array.from(keys);
                  if (firstKey !== undefined) {
                    setSelectedSampleName(String(firstKey));
                  }
                }}
                className="w-full"
              >
                {focused?.samples.map((sample) => {
                  const metrics = data?.sampleMetrics[sample.name];

                  return (
                    <ListBox.Item
                      key={sample.id}
                      id={sample.name}
                      textValue={sample.name}
                      isDisabled={!metrics}
                      className={cn(
                        "border-default/25 bg-surface/95 mb-1 rounded-lg border px-3 py-2 shadow-xs transition-colors",
                        "hover:bg-current/10 hover:shadow-sm data-[selected=true]:border-current/80 data-[selected=true]:bg-current/18",
                        "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-45",
                        sample.isNegativeControl
                          ? "text-warning"
                          : "text-accent",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Label className="truncate font-semibold">
                          {sample.name}
                        </Label>
                        <Description className="text-xs opacity-75">
                          {metrics
                            ? `${metrics.nIdentifiedSequences} / ${metrics.nSequences} identified`
                            : "No metrics available"}
                        </Description>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  );
                })}
              </ListBox>
            </ScrollShadow>
          </div>

          <div
            className={cn(
              "min-h-0 overflow-hidden rounded-xl border shadow-sm",
              selectedSample?.isNegativeControl
                ? "border-warning/40 bg-warning/10 text-warning"
                : "border-accent/50 bg-surface/75 text-accent",
            )}
          >
            <div className="scrollbar-hide h-full min-h-0 overflow-auto">
              {selectedSample && selectedMetrics ? (
                <div className="flex min-h-full flex-col">
                  <div className="bg-surface/75 sticky top-0 z-10 rounded-t-xl border-b border-current/65 px-3 pt-2 pb-1 text-center text-current backdrop-blur-sm">
                    <p className="text-foreground text-base font-bold uppercase">
                      --- {selectedSample.name} ---
                    </p>
                    <ProgressBar
                      size="lg"
                      value={selectedMetrics.nIdentifiedSequences ?? 0}
                      maxValue={selectedMetrics.nSequences ?? 1}
                    >
                      <Label className="text-foreground px-1">
                        Identified Sequences:{" "}
                        {selectedMetrics.nIdentifiedSequences ?? 0} of{" "}
                        {selectedMetrics.nSequences ?? 0}
                      </Label>
                      <ProgressBar.Output className="text-foreground text-xs" />
                      <ProgressBar.Track className="bg-surface-tertiary">
                        <ProgressBar.Fill />
                      </ProgressBar.Track>
                    </ProgressBar>
                  </div>
                  <div className="m-2 mb-2 flex flex-col gap-1.5">
                    {selectedMetrics.pathologies?.map((pathology) => (
                      <div
                        key={pathology.name}
                        className="grid cursor-pointer grid-cols-[1.5fr_auto_3fr] items-center justify-center transition"
                      >
                        <div className="flex flex-col justify-center rounded-lg border border-current/85 bg-current/12 p-1.5 shadow-sm ring-1 ring-current/20 ">
                          <p className="text-foreground font-semibold">
                            {pathology.name}
                          </p>
                          <ProgressBar
                            size="sm"
                            value={pathology.nReads}
                            maxValue={selectedMetrics.nSequences}
                          >
                            <Label className="text-foreground text-xs">
                              {pathology.nReads} of {selectedMetrics.nSequences}
                            </Label>
                            <ProgressBar.Output className="text-foreground text-xs" />
                            <ProgressBar.Track className="bg-surface-tertiary">
                              <ProgressBar.Fill />
                            </ProgressBar.Track>
                          </ProgressBar>
                        </div>
                        <div className="h-(--line-size) w-3 self-center bg-current/80" />
                        <div className="flex h-full flex-col">
                          {pathology.pathogens.map(
                            (pathogen, pathogenIndex) => (
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
                                        "h-full w-(--line-size) bg-current/80",
                                        pathogenIndex === 0 &&
                                          "h-[calc(50%+var(--line-size)/2)] rounded-tl-4xl",
                                        pathogenIndex ===
                                          pathology.pathogens.length - 1 &&
                                          "h-[calc(50%+var(--line-size)/2)] rounded-bl-4xl",
                                      )}
                                    />
                                  )}
                                  <div className="h-(--line-size) w-2 self-center bg-current/80" />
                                </div>
                                <div className="my-0.5 flex w-full flex-col gap-1 rounded-lg border border-current/75 bg-current/10 p-1.5 shadow-sm ring-1 ring-current/15">
                                  <p className="text-foreground font-semibold">
                                    {pathogen.pathogen}
                                  </p>

                                  <ProgressBar
                                    size="sm"
                                    value={pathogen.nReads}
                                    maxValue={selectedMetrics.nSequences}
                                  >
                                    <Label className="text-foreground text-xs">
                                      {pathogen.nReads} of{" "}
                                      {selectedMetrics.nSequences}
                                    </Label>
                                    <ProgressBar.Output className="text-foreground text-xs" />
                                    <ProgressBar.Track className="bg-surface-tertiary">
                                      <ProgressBar.Fill />
                                    </ProgressBar.Track>
                                  </ProgressBar>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-muted flex h-full items-center justify-center p-6">
                  Select a sample to view metrics
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Accordion>
  );
}
