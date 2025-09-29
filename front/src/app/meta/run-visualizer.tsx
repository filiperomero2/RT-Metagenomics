import { IconState } from "@/components/icon/state-icon";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import {
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { SampleVisualizer } from "./sample-visualizer";
import { RunMetrics } from "./run-metrics";

export function RunVisualizer() {
  const focused = useFocusedRun();

  if (!focused?.samples.length) return null;

  return (
    <Modal
      isOpen={!!focused?.id}
      size="full"
      isDismissable={false}
      onClose={() => setFocusedRun(undefined)}
    >
      <ModalContent>
        <ModalHeader className="items-center gap-2 capitalize">
          <IconState state={focused?.state || "pending"} />
          <span className="flex-1">
            {`${focused?.parameters.dataType} - ${focused?.name}`}
          </span>
        </ModalHeader>
        <ModalBody className="overflow-auto">
          <div id="run-visualizer" className="scrollbar-hide w-full snap-y space-y-1 gap-x-1 overflow-y-auto">

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
