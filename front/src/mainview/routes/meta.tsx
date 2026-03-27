import { createFileRoute } from "@tanstack/react-router";
import { SampleComparator } from "@/mainview/components/meta/sample-comparator";
import { NewRunForm } from "@/mainview/components/meta/new-run-form";
import { RunTable } from "@/mainview/components/meta/run-table";
import { RunVisualizer } from "@/mainview/components/meta/run-visualizer";

export const Route = createFileRoute("/meta")({
  component: Meta,
});

function Meta() {
  return (
    <div className="h-[calc(100vh-65px)] p-4">
      {/* <RunVisualizer />
      <SampleComparator /> */}

      <div className="bg-content1 rounded-2xl p-4 py-6 shadow-md">
        <div className="text-foreground-800 mb-4 flex w-full items-center justify-between gap-3 pb-6 text-3xl font-bold">
          <h1>All Metagenomics</h1>
          <NewRunForm />
        </div>
        <RunTable />
      </div>
    </div>
  );
}
