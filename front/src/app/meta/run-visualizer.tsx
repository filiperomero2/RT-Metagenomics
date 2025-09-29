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
import { RunCharts } from "./run-charts";

export function RunVisualizer() {
  const focused = useFocusedRun();

  if (!focused?.samples.length) return null;
  console.log(focused);

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
          <div className="scrollbar-hide w-full snap-y space-y-1 gap-x-1 overflow-y-auto">
            <h1 className="my-2 w-full text-center text-3xl">Charts</h1>
            <Divider className="mx-auto my-3 w-11/12 opacity-40" />
            <RunCharts />
            <Divider className="mx-auto my-3 w-11/12 opacity-40" />
            <h1 className="my-2 w-full text-center text-3xl">Samples</h1>
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
