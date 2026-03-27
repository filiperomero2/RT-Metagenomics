import { Accordion } from "@/mainview/components/custom-accordion";
import { ErrorFull } from "@/mainview/components/state-components/error-full";
import { LoadingFull } from "@/mainview/components/state-components/loading-full";
import { useSample } from "@/mainview/hooks/use-sample";
import {
  toggleSelectedCharts,
  useIsChartSelected,
} from "@/mainview/hooks/use-selected-charts";
import { Sample } from "@/mainview/types/meta-genomic-run";
import { Checkbox } from "@heroui/react";
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
  const { data, isPending, isError } = useSample(sample);

  const showSample = !isClosed || !!isComparing;

  const handleToggle = () => setClosed(!isClosed);

  return (
    <Accordion
      show={showSample}
      toggle={!isComparing ? handleToggle : undefined}
      className="h-[83dvh] data-[fullscreen='true']:h-full"
      isLoading={isPending}
      stateIndicator={data ? "success" : "warning"}
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
