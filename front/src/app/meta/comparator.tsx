import { useModal } from "@/hooks/use-modal";
import {
  clearSelectedCharts,
  useSelectedCharts,
} from "@/hooks/use-selected-charts";
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { motion } from "framer-motion";
import { SquareSplitHorizontal, X } from "lucide-react";
import { Fragment } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Chart } from "./chart";

export function MetaComparator() {
  const modal = useModal();
  const samples = useSelectedCharts();

  const handleCompare = () => {
    modal.handleOpen();
  };

  return (
    <>
      <motion.div
        className="bg-content1 fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 gap-2 rounded-2xl px-3 py-2"
        initial={{ opacity: 0, y: 200 }}
        animate={
          samples.length > 1 && !modal.modal.isOpen
            ? { opacity: 1, y: 0 }
            : { opacity: 0, y: 200 }
        }
      >
        <Button
          onPress={handleCompare}
          size="sm"
          variant="shadow"
          color="primary"
          type="button"
          endContent={<SquareSplitHorizontal />}
        >
          Compare charts
        </Button>

        <Button
          onPress={clearSelectedCharts}
          isIconOnly
          size="sm"
          variant="shadow"
          color="danger"
          type="button"
        >
          <X />
        </Button>
      </motion.div>
      <Modal {...modal.modal} size="full" isDismissable={false}>
        <ModalContent>
          <ModalHeader>
            Comparing charts {samples.map((s) => s.name).join(", ")}
          </ModalHeader>

          <ModalBody>
            <PanelGroup
              className="flex h-full w-full gap-1"
              direction="horizontal"
              // autoSaveId={`meta-comparator-${ids.join("-")}`}
            >
              {samples.map((sample, index) => (
                <Fragment key={`${sample.runId}-${sample.id}`}>
                  <Panel key={`${sample.runId}-${sample.id}`}>
                    <Chart sample={sample} isComparing />
                  </Panel>
                  {index < samples.length - 1 && <PanelResizeHandle />}
                </Fragment>
              ))}
            </PanelGroup>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
