import { IconState } from "@/components/icon/state-icon";
import { ShowComponent } from "@/components/show-components";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import {
  toggleSelectedCharts,
  useIsChartSelected,
} from "@/hooks/use-selected-charts";
import { api } from "@/lib/axios";
import { Sample } from "@/types/meta-genomic-run";
import { cn } from "@/utils/cn";
import { queryKeys } from "@/utils/query-keys-factory";
import { Button, Checkbox } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Maximize, Minimize, Trash } from "lucide-react";
import { useEffect, useId, useState } from "react";

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
    refetchInterval: 30000,
    queryFn: async () => {
      const response = await api.get(
        `v1/metagenomics/${sample.runId}/${sample.id}/result`
      );
      return response.data;
    },
  });

  useEffect(() => {
    document.addEventListener("fullscreenchange", (e) => {
      setFullScreen(document.fullscreenElement?.id === uniqueId);
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
      className="w-full overflow-hidden rounded-xl relative flex flex-col snap-center bg-content1 "
      id={uniqueId}
    >
      <div className="bg-content2/70 text-content2-foreground px-3 py-1 rounded-xl shadow relative flex items-center justify-between gap-2 w-full mx-auto">
        <div className="flex capitalize items-center">
          {!isFullScreen && !isComparing && (
            <motion.div animate={{ rotateZ: showSample ? 90 : 0 }}>
              <Button
                isIconOnly
                variant="light"
                onPress={() => setClosed(!isClosed)}
              >
                <ChevronRight />
              </Button>
            </motion.div>
          )}
          {isComparing ? (
            <h1>{sample.name}</h1>
          ) : (
            <Checkbox
              className="pl-4"
              size="lg"
              isSelected={isSelected}
              onChange={() => toggleSelectedCharts(sample)}
            >
              {sample.name}
            </Checkbox>
          )}
        </div>

        <div className="flex relative">
          <AnimatePresence mode="popLayout">
            {!showSample && (
              <motion.div
                initial={{ opacity: 0, translateX: 35 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: 35 }}
                className="w-full h-full flex items-center justify-center"
              >
                <IconState
                  state={isError ? "failed" : isPending ? "running" : "pending"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {showSample && (
              <motion.div
                initial={{ opacity: 0, translateX: 35 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: 35 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Button
                  onPress={handleFullScreen}
                  isIconOnly
                  size="sm"
                  variant="light"
                >
                  {isFullScreen ? <Minimize /> : <Maximize />}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ShowComponent
        show={showSample}
        gridClassName="h-full"
        initial={false}
        gridInnerClassName="bg-content2 mt-1 rounded-xl"
      >
        <div className={cn("h-[83dvh]", isFullScreen && "h-full")}>
          {isPending && <LoadingFull />}
          {isError && <ErrorFull label="Visualization not ready" />}
          {data && <iframe srcDoc={data} className="w-full h-full bg-white" />}
        </div>
      </ShowComponent>
    </div>
  );
}
