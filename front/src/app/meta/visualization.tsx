import { IconState } from "@/components/icon/state-icon";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@heroui/react";
import { Info } from "lucide-react";
import { Chart } from "./chart";

export function MetaVisualization() {
  const focused = useFocusedRun();

  if (!focused?.samples.length) return null;

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
        <ModalHeader className="gap-2 capitalize items-center">
          <IconState state={focused?.state || "pending"} />
          <span className="flex-1">
            {`${focused?.parameters.dataType} - ${focused?.name}`}
          </span>
        </ModalHeader>
        <ModalBody className="overflow-auto">
          <div className="w-full overflow-y-auto snap-y scrollbar-hide space-y-1 gap-x-1">

            {focused?.samples.map((sample) => (
              <Chart key={`${sample.runId}-${sample.id}`} sample={sample} />
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

