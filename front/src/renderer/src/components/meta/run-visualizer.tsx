import { IconState } from "@/components/icon/state-icon";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import { useMetrics } from "@/hooks/use-metrics";
import {
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Progress,
} from "@heroui/react";
import { DownloadIcon, XIcon } from "lucide-react";
import { RunMetrics } from "./run-metrics";
import { SampleVisualizer } from "./sample-visualizer";
import { api } from "@/lib/axios";

const progressColorMap = {
  pending: "warning",
  running: "primary",
  completed: "success",
  failed: "danger",
  cancelled: "warning",
} as const;

export function RunVisualizer() {
  const focused = useFocusedRun();
  const { data } = useMetrics();
  const summary = data?.summaryMetrics;

  if (!focused?.samples.length) return null;

  return (
    <Modal
      isOpen={!!focused?.id}
      size="full"
      isDismissable={false}
      hideCloseButton
      onClose={() => setFocusedRun(undefined)}
    >
      <ModalContent className="scrollbar-hide overflow-auto">
        <ModalHeader className="bg-content1/70 sticky top-0 z-20 grid grid-cols-[1fr_3fr_auto] items-center gap-1.5 p-2 px-6 capitalize backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <IconState state={focused?.state || "pending"} />
            <span className="text-medium flex-1">
              {`${focused?.parameters.dataType} - ${focused?.name}`}
            </span>
          </div>

          <div className="bg-content2/40 border-content2-foreground/20 relative flex h-full items-center rounded-sm border p-2  shadow backdrop-blur-xs">
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
            <Divider
              orientation="vertical"
              className="bg-content2-foreground/20 mx-3"
            />
            <Progress
              showValueLabel={!!summary?.nTotalReads}
              size="sm"
              color={progressColorMap[focused.state] ?? "default"}
              classNames={{
                label: "text-xs",
                track: "h-3 rounded-sm",
                base: "gap-0.5",
              }}
              label={
                <span>
                  Identified Reads:
                  <span className="ml-1 font-normal">
                    {summary?.nTotalIdentifiedReads ?? "0"} of{" "}
                    {summary?.nTotalReads ?? "0"}
                  </span>
                </span>
              }
              value={summary?.nTotalIdentifiedReads ?? 1}
              maxValue={summary?.nTotalReads ?? 1}
            />
            <Button
              as="a"
              href={`${api.defaults.baseURL}v1/metagenomics/${focused.id}/export`}
              download
              variant="solid"
              isIconOnly
              size="sm"
              className="ml-2"
            >
              <DownloadIcon size={18}/>
            </Button>
          </div>

          <Button
            className="relative top-0 right-0"
            isIconOnly
            variant="light"
            onPress={() => setFocusedRun(undefined)}
          >
            <XIcon />
          </Button>
        </ModalHeader>
        <ModalBody className="from-content1/60to-background bg-gradient-to-b">
          <div id="run-visualizer" className="w-full snap-y space-y-1 gap-x-1">
            <RunMetrics />
            <Divider className="mx-auto my-3 w-11/12 opacity-40" />

            {focused?.samples.map((sample) => (
              <SampleVisualizer
                key={`${sample.runId}-${sample.id}`}
                sample={sample}
              />
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
