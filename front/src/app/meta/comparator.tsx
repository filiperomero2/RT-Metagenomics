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
import { Chart } from "./visualization";

export function MetaComparator() {
  const modal = useModal();
  const ids = useSelectedCharts();

  const handleCompare = () => {
    modal.handleOpen();
  };

  return (
    <>
      <motion.div
        className="fixed bottom-4 z-[60] left-1/2 -translate-x-1/2 flex gap-2 bg-content1 py-2 px-3 rounded-2xl"
        initial={{ opacity: 0, y: 200 }}
        animate={
          ids.length > 1 && !modal.modal.isOpen
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
          <ModalHeader>Comparing charts {ids.join(", ")}</ModalHeader>

          <ModalBody>
            <PanelGroup
              className="flex gap-1 w-full h-full"
              direction="horizontal"
              // autoSaveId={`meta-comparator-${ids.join("-")}`}
            >
              {ids.map((id, index) => (
                <Fragment key={id}>
                  <Panel key={id}>
                    <Chart id={id} hideSelection />
                  </Panel>
                  {index < ids.length-1 && <PanelResizeHandle />}
                </Fragment>
              ))}
            </PanelGroup>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
