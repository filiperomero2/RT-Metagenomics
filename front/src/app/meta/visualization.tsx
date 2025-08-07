import { IconState } from "@/components/icon/state-icon";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import {
  toggleSelectedCharts,
  useIsChartSelected,
} from "@/hooks/use-selected-charts";
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";
import { Maximize, Minimize } from "lucide-react";
import { useEffect, useId, useState } from "react";

export function MetaVisualization() {
  const focused = useFocusedRun();

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
          {focused?.name}
        </ModalHeader>
        <ModalBody>
          <div className="w-full h-full space-y-1.5 overflow-y-auto snap-y scrollbar-hide">
            <Chart id={1} />
            <Chart id={2} />
            <Chart id={3} />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export function Chart({
  id,
  hideSelection,
}: {
  id: number;
  hideSelection?: boolean;
}) {
  const uniqueId = useId()
  const [isFullScreen, setFullScreen] = useState(false);
  const isSelected = useIsChartSelected(id);
  // const { data, isPending, isError } = useQuery({
  //   enabled: !!id,
  //   queryKey: queryKeys.getMetaGenomic(Number(id)),
  //   queryFn: async () => {
  //     const response = await api.get(`v1/metagenomics/${id}/result`);
  //     return response.data;
  //   },
  // });

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

  // if (!id) return <EmptyFull label="No metagenomic selected" />;
  // if (isPending) return <LoadingFull />;
  // if (isError) return <ErrorFull label="Visualization not ready" />;

  return (
    <div
      className="w-full h-[98%] overflow-hidden rounded-2xl relative snap-center"
      id={uniqueId}
    >
      {/* <iframe srcDoc={data} className="w-full h-full rounded-sm bg-white" /> */}

      <div className="w-full h-full rounded-sm bg-amber-400" />

      <div className="absolute bottom-1 right-1 bg-content1/50 px-1 py-1 rounded-xl shadow flex items-center justify-center">
        {!hideSelection && (
          <Checkbox
            className="pl-3"
            size="lg"
            isSelected={isSelected}
            onChange={() => toggleSelectedCharts(id)}
          />
        )}
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
    </div>
  );
}
