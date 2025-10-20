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
import { motion } from "framer-motion";
import { InfoIcon, XIcon } from "lucide-react";
import { RunMetrics } from "./run-metrics";
import { SampleVisualizer } from "./sample-visualizer";

const progressColorMap = {
  pending: "warning",
  running: "primary",
  completed: "success",
  failed: "danger",
  canceled: "danger",
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
        <ModalHeader className="bg-content1/60 sticky top-0 z-5 grid grid-cols-[1fr_3fr_auto] items-center gap-1.5 p-2 px-6 capitalize backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <IconState state={focused?.state || "pending"} />
            <span className="text-medium flex-1">
              {`${focused?.parameters.dataType} - ${focused?.name}`}
            </span>
          </div>

          <div className="bg-content2/60 border-content2-foreground/20 relative flex h-full items-center rounded-sm border p-2 px-6 shadow backdrop-blur-2xl">
            <div className="flex w-1/3 flex-col pr-2 text-xs">
              <span className="flex justify-between font-semibold">
                lastAnalysisTime:
                <span className="font-normal">
                  {summary?.lastAnalysisTime.toFixed(2)}
                </span>
              </span>
              <span className="flex justify-between font-semibold">
                meanTimeOfAnalysis:
                <span className="font-normal">
                  {summary?.meanTimeOfAnalysis.toFixed(2)}
                </span>
              </span>
            </div>
            <Divider
              orientation="vertical"
              className="bg-content2-foreground/20 mx-3"
            />
            <Progress
              showValueLabel
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
                    {summary?.nTotalIdentifiedReads} of {summary?.nTotalReads}
                  </span>
                </span>
              }
              value={summary?.nTotalIdentifiedReads}
              maxValue={summary?.nTotalReads}
            />
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
