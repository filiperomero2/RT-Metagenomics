import { Accordion } from "@/components/custom-accordion";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { useSample } from "@/hooks/use-sample";
import {
  toggleSelectedCharts,
  useIsChartSelected,
} from "@/hooks/use-selected-charts";
import { Sample } from "@/types/meta-genomic-run";
import { Checkbox, Label } from "@heroui/react";
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
            id={`sample-toggle-${sample.id}`}
            className="py-0 pl-4"
            isSelected={isSelected}
            onChange={() => toggleSelectedCharts(sample)}
          >
            <Checkbox.Control className="size-5">
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label htmlFor={`sample-toggle-${sample.id}`}>{sample.name}</Label>
            </Checkbox.Content>
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
