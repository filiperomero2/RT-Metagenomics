import { IconState } from "@/components/icon/state-icon";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { Chart } from "./chart";

export function MetaVisualization() {
  const focused = useFocusedRun();

  if (!focused?.samples.length) return null;
  console.log(focused);

  return (
    <Modal
      isOpen={!!focused?.id}
      size="full"
      isDismissable={false}
      onClose={() => {
        setFocusedRun(undefined);
      }}
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
            {focused?.samples.map((sample) => (
              <Chart key={`${sample.runId}-${sample.id}`} sample={sample} />
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
