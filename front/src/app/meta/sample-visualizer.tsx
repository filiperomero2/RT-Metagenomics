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
import { useState } from "react";

export function SampleVisualizer({
  sample,
  isComparing,
}: {
  sample: Sample;
  isComparing?: boolean;
}) {
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
  const showSample = !isClosed || !!isComparing;

  const handleToggle = () => setClosed(!isClosed);

  return (
    <Accordion
      show={showSample}
      toggle={!isComparing ? handleToggle : undefined}
      className="h-[83dvh] data-[fullscreen='true']:h-full"
      title={
        isComparing ? (
          <h1>{sample.name}</h1>
        ) : (
          <Checkbox
            className="py-0 pl-4"
            size="lg"
            isSelected={isSelected}
            onChange={() => toggleSelectedCharts(sample)}
          >
            {sample.name}
          </Checkbox>
        )
      }
    >
      {isPending && <LoadingFull />}
      {isError && <ErrorFull label="Visualization not ready" />}
      {data && <iframe srcDoc={data} className="h-full w-full bg-white" />}
    </Accordion>
  );
}
