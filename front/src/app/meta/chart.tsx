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
import { Button, Checkbox, CircularProgress, Progress } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Maximize, Minimize } from "lucide-react";
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

  const actionsBar = (
    <div className="bg-content2/70 px-3 py-1 rounded-xl shadow relative flex items-center justify-between gap-2 w-full mx-auto">
      <div className="flex capitalize items-center">
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
        <motion.div
          initial={{ opacity: 0, translateX: 40 }}
          animate={{
            opacity: showSample ? 0 : 1,
            translateX: showSample ? 40 : 0,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <IconState
            state={isError ? "failed" : isPending ? "running" : "pending"}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, translateX: 40 }}
          animate={{
            opacity: !showSample ? 0 : 1,
            translateX: !showSample ? 40 : 0,
          }}
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
      </div>
    </div>
  );

  return (
    <div
      className="w-full overflow-hidden rounded-xl relative flex flex-col snap-center"
      id={uniqueId}
    >
      {actionsBar}
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
