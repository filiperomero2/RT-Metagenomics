import { IconState } from "@/components/icon/state-icon";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import { useMetrics } from "@/hooks/use-metrics";
import { Button, Label, Modal, ProgressBar, Separator } from "@heroui/react";
import { DownloadIcon, XIcon } from "lucide-react";
import { RunMetrics } from "./run-metrics";
import { SampleVisualizer } from "./sample-visualizer";
import { api } from "@/lib/axios";

const progressColorMap = {
  pending: "warning",
  running: "accent",
  completed: "success",
  failed: "danger",
  cancelled: "warning",
} as const;

export function RunVisualizer() {
  const focused = useFocusedRun();
  const { data } = useMetrics();
  const summary = data?.summaryMetrics;
  console.log(focused);
  if (!focused?.samples.length) return null;

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={!!focused?.id}
        variant="blur"
        isDismissable={false}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setFocusedRun(undefined);
          }
        }}
      >
        <Modal.Container size="cover" scroll="inside" className="p-5">
          <Modal.Dialog>
            <Modal.Header className="bg-surface/90 sticky top-0 z-20 grid grid-cols-[1fr_3fr_auto] items-center gap-1.5 py-1 capitalize backdrop-blur-2xl">
              <div className="flex items-center gap-2">
                <IconState state={focused?.state || "pending"} />
                <span className="flex-1 text-base">
                  {`${focused?.parameters.dataType} - ${focused?.name}`}
                </span>
              </div>

              <div className="bg-surface-secondary/40 border-muted/30 relative flex h-full items-center rounded-sm border p-2 shadow backdrop-blur-xs">
                <div className="flex w-1/3 flex-col pr-2 text-xs">
                  <span className="flex justify-between font-semibold">
                    lastAnalysisTime:
                    <span className="font-normal">
                      {(summary?.lastAnalysisTime ?? 0).toFixed(2)}s
                    </span>
                  </span>
                  <span className="flex justify-between font-semibold">
                    meanTimeOfAnalysis:
                    <span className="font-normal">
                      {(summary?.meanTimeOfAnalysis ?? 0).toFixed(2)}s
                    </span>
                  </span>
                </div>

                <Separator
                  orientation="vertical"
                  className="bg-muted/40 mx-3"
                />

                <ProgressBar
                  value={summary?.nTotalIdentifiedReads ?? 1}
                  maxValue={summary?.nTotalReads ?? 1}
                  size="sm"
                  color={progressColorMap[focused.state] ?? "default"}
                  className="gap-0.5"
                >
                  <Label className="text-xs">
                    Identified Reads:
                    <span className="ml-1 font-normal">
                      {summary?.nTotalIdentifiedReads ?? "0"} of{" "}
                      {summary?.nTotalReads ?? "0"}
                    </span>
                  </Label>
                  {!!summary?.nTotalReads && <ProgressBar.Output />}
                  <ProgressBar.Track className="h-3 rounded-sm">
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>

                <a
                  href={`${api.defaults.baseURL}v1/metagenomics/${focused.id}/export`}
                  download
                  className="ml-2 inline-flex"
                >
                  <Button variant="primary" isIconOnly size="sm">
                    <DownloadIcon size={18} />
                  </Button>
                </a>
              </div>

              <Button
                className="self-start"
                isIconOnly
                variant="tertiary"
                onPress={() => setFocusedRun(undefined)}
              >
                <XIcon />
              </Button>
            </Modal.Header>
            <Modal.Body id="run-visualizer" className="scrollbar-hide">
              <div className="bg-surface h-fit snap-y space-y-1 gap-x-1">
                <RunMetrics />
                <Separator className="mx-auto my-3 w-11/12 opacity-40" />

                {focused?.samples.map((sample) => (
                  <SampleVisualizer
                    key={`${sample.runId}-${sample.id}`}
                    sample={sample}
                  />
                ))}
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
