import { BarChart } from "@/components/metrics/bar-chart";
import { HeatMapChart } from "@/components/metrics/heatmap-chart";
import { useMetrics } from "@/hooks/use-metrics";
import {
  generateFamilyDataSets,
  generateViralDataSets,
} from "@/utils/generate-datasets";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Accordion } from "../custom-accordion";

export function RunCharts() {
  const { data, isPending } = useMetrics();
  const [log, setLog] = useState(false);
  const [show, setShow] = useState(false);

  const familyDataSets = useMemo(
    () => generateFamilyDataSets(data?.sampleMetrics),
    [data?.sampleMetrics],
  );
  const viralDataSets = useMemo(
    () => generateViralDataSets(data?.sampleMetrics),
    [data?.sampleMetrics],
  );

  const hasValues =
    (viralDataSets
      ?.map((item) => item.data)
      .flat()
      .filter(Boolean).length ?? 0) > 0;

  return (
    <Accordion
      show={show}
      toggle={() => setShow(!show)}
      title="Graphs"
      className="h-[70dvh] p-1 data-[fullscreen='true']:h-full"
      stateIndicator={hasValues ? "success" : "warning"}
      isLoading={!hasValues || isPending}
      actions={[
        {
          label: "Log10",
          active: log,
          icon: <ChartNoAxesColumnIncreasing />,
          onPress: () => setLog(!log),
        },
      ]}
    >
      <PanelGroup direction="horizontal" className="h-full gap-1">
        <Panel key="viral" className="h-full" minSize={25}>
          <BarChart
            title="Total reads per sample (Classified vs Unclassified)"
            dataSets={viralDataSets}
            isLoading={isPending}
            log={log}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel key="family" className="h-full" minSize={25}>
          <BarChart
            title="Reads per family per sample (absolute)"
            legend="Family"
            dataSets={familyDataSets}
            isLoading={isPending}
            log={log}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel key="heatmap" className="h-full" minSize={25}>
          <HeatMapChart
            title="HeatMap"
            dataSets={familyDataSets}
            isLoading={isPending}
            log={log}
          />
        </Panel>
      </PanelGroup>
    </Accordion>
  );
}
