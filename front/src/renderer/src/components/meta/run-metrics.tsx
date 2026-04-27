import { BarChart } from "@/components/metrics/bar-chart";
import { HeatMapChart } from "@/components/metrics/heatmap-chart";
import { MetricsTable } from "@/components/metrics/metrics-table";
import { useMetrics } from "@/hooks/use-metrics";
import {
  generateFamilyDataSets,
  generateViralDataSets,
} from "@/utils/generate-datasets";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import { useMemo, useState } from "react";
import { Accordion } from "../custom-accordion";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export function RunMetrics() {
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
    <>
      <MetricsTable />
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
        <PanelGroup direction="horizontal" className="gap-1 h-full">
          <Panel key="viral" className="h-full">
            <BarChart
              title="Total reads per sample (Classified vs Unclassified)"
              dataSets={viralDataSets}
              isLoading={isPending}
              log={log}
            />
          </Panel>
          <PanelResizeHandle />
          <Panel key="family" className="h-full">
            <BarChart
              title="Reads per family per sample (absolute)"
              legend="Family"
              dataSets={familyDataSets}
              isLoading={isPending}
              log={log}
            />
          </Panel>
          <PanelResizeHandle />
          <Panel key="heatmap" className="h-full">
            <HeatMapChart
              title="HeatMap"
              dataSets={familyDataSets}
              isLoading={isPending}
              log={log}
            />
          </Panel>
        </PanelGroup>
      </Accordion>
    </>
  );
}
