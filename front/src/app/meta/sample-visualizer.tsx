import { Accordion } from "@/components/custom-accordion";
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
import { Checkbox } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";

export function SampleVisualizer({
  sample,
  isComparing,
}: {
  sample: Sample;
  isComparing?: boolean;
}) {
  const uniqueId = useId();
  const [isFullScreen, setFullScreen] = useState(false);
  const [isClosed, setClosed] = useState(true);
  const isSelected = useIsChartSelected(sample);

  const { data, isPending, isError } = useQuery({
    queryKey: queryKeys.getMetaGenomic(sample),
    refetchInterval: 30000,
    queryFn: async () => {
      const response = await api.get(
        `v1/metagenomics/${sample.runId}/${sample.id}/result`,
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
  const handleToggle = () => setClosed(!isClosed);

  const showSample = !isClosed || isFullScreen || !!isComparing;

  return (
    <Accordion
      show={showSample}
      toggle={!isComparing ? handleToggle : undefined}
      title={
        isComparing ? (
          <h1>{sample.name}</h1>
        ) : (
          <Checkbox
            className="pl-4 py-0"
            size="lg"
            isSelected={isSelected}
            onChange={() => toggleSelectedCharts(sample)}
          >
            {sample.name}
          </Checkbox>
        )
      }
    >
      <div className={cn("h-[83dvh]", isFullScreen && "h-full")}>
        {isPending && <LoadingFull />}
        {isError && <ErrorFull label="Visualization not ready" />}
        {data && <iframe srcDoc={data} className="h-full w-full bg-white" />}
      </div>
    </Accordion>
  );
}
