import { useModal } from "@/hooks/use-modal";
import {
  clearSelectedCharts,
  useSelectedCharts,
} from "@/hooks/use-selected-charts";
import { Button, Modal } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { SquareSplitHorizontal, X } from "lucide-react";
import { Fragment } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SampleVisualizer } from "./sample-visualizer";
import { Portal } from "../portal";

export function SampleComparator() {
  const { handleOpen, modal } = useModal();
  const samples = useSelectedCharts();

  const handleCompare = () => {
    handleOpen();
  };

  return (
    <>
      <Portal>
        <AnimatePresence>
          {samples.length > 1 && !modal.isOpen && (
            <motion.div
              data-react-aria-top-layer
              className="bg-surface-secondary pointer-events-auto absolute bottom-4 left-1/2 z-[999999] flex -translate-x-1/2 gap-2 rounded-2xl px-3 py-2"
              initial={{ opacity: 0, y: 200 }}
              exit={{ opacity: 0, y: 200 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onPress={handleCompare}
                size="sm"
                variant="primary"
                type="button"
              >
                <SquareSplitHorizontal />
                Compare charts
              </Button>

              <Button
                onPress={clearSelectedCharts}
                isIconOnly
                size="sm"
                variant="danger"
                type="button"
              >
                <X />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
      <Modal>
        <Modal.Backdrop {...modal} isDismissable={false}>
          <Modal.Container size="cover" className="p-5">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                Comparing charts {samples.map((s) => s.name).join(", ")}
              </Modal.Header>

              <Modal.Body>
                <PanelGroup
                  className="flex h-full w-full gap-1"
                  direction="horizontal"
                  // autoSaveId={`meta-comparator-${ids.join("-")}`}
                >
                  {samples.map((sample, index) => (
                    <Fragment key={`${sample.runId}-${sample.id}`}>
                      <Panel key={`${sample.runId}-${sample.id}`} minSize={25}>
                        <SampleVisualizer sample={sample} isComparing />
                      </Panel>
                      {index < samples.length - 1 && <PanelResizeHandle />}
                    </Fragment>
                  ))}
                </PanelGroup>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
