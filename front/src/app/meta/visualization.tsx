import { IconState } from "@/components/icon/state-icon";
import { ShowComponent } from "@/components/show-components";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import {
  toggleSelectedCharts,
  useIsChartSelected,
} from "@/hooks/use-selected-charts";
import { api } from "@/lib/axios";
import { Sample } from "@/types/meta-genomic-run";
import { cn } from "@/utils/cn";
import { queryKeys } from "@/utils/query-keys-factory";
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Maximize, Minimize } from "lucide-react";
import { useEffect, useId, useState } from "react";

export function MetaVisualization() {
  const focused = useFocusedRun();
  console.log("Focused", focused);

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
        <ModalHeader className="gap-2 capitalize">
          <IconState state={focused?.state || "pending"} />
          {`${focused?.parameters.dataType} - ${focused?.name}`}
        </ModalHeader>
        <ModalBody className=" overflow-auto">
          <div className="w-full h-full overflow-y-auto snap-y  scrollbar-hide space-y-1">
            {focused?.samples.map((sample) => (
              <Chart key={`${sample.runId}-${sample.id}`} sample={sample} />
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function Chart({
  sample,
  isComparing,
}: {
  sample: Sample;
  isComparing?: boolean;
}) {
  const uniqueId = useId();
  const [isClosed, setClosed] = useState(true);
  const [isFullScreen, setFullScreen] = useState(false);
  const isSelected = useIsChartSelected(sample);

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.getMetaGenomic(sample),
    retry: false,
    queryFn: async () => {
      const response = await api.get(
        `v1/metagenomics/${sample.runId}/${sample.id}/result`
      );
      return response.data;
    },
  });

  useEffect(() => {
    document.addEventListener("fullscreenchange", (e) => {
      setFullScreen(!!document.fullscreenElement);
    });
    return () => document.removeEventListener("fullscreenchange", () => {});
  }, []);

  const handleFullScreen = () => {
    const element = document.getElementById(uniqueId);
    if (!isFullScreen) {
      element?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const showSample = !isClosed || isFullScreen || !!isComparing;

  return (
    <div
      className="w-full overflow-hidden rounded-xl relative flex flex-col snap-center"
      id={uniqueId}
    >
      <div className="bg-content2/70 px-3 py-1 rounded-xl shadow  flex items-center justify-between gap-2 w-full mx-auto">
        <div className="flex">
          {!isFullScreen && !isComparing && (
            <motion.div animate={{ rotateZ: showSample ? 90 : 0 }}>
              <Button
                isIconOnly
                disableRipple
                variant="light"
                onPress={() => setClosed(!isClosed)}
              >
                <ChevronRight />
              </Button>
            </motion.div>
          )}
          {isComparing ? (
            <h1>{sample.name.toUpperCase()}</h1>
          ) : (
            <Checkbox
              className="pl-3"
              size="lg"
              isSelected={isSelected}
              onChange={() => toggleSelectedCharts(sample)}
            >
              {sample.name.toUpperCase()}
            </Checkbox>
          )}
        </div>
        <Button
          onPress={handleFullScreen}
          isIconOnly
          size="sm"
          variant="light"
          className="z-10"
        >
          {isFullScreen ? <Minimize /> : <Maximize />}
        </Button>
      </div>
      <ShowComponent
        show={showSample}
        gridClassName="h-full"
        initial={false}
        gridInnerClassName="bg-content2 mt-1 rounded-xl"
      >
        <div className={cn("h-[85vh]", isFullScreen && "h-full")}>
          {isPending && <LoadingFull />}
          {isError && <ErrorFull label="Visualization not ready" />}
          {data && <iframe srcDoc={data} className="w-full h-full bg-white" />}
        </div>
      </ShowComponent>
    </div>
  );
}
