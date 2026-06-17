import { createFileRoute } from "@tanstack/react-router";
import { SampleComparator } from "@/components/meta/sample-comparator";
import { NewRunForm } from "@/components/meta/new-run-form";
import { RunTable } from "@/components/meta/run-table";
import { RunVisualizer } from "@/components/meta/run-visualizer";

export const Route = createFileRoute("/meta")({
  component: Meta,
});

function Meta() {
  return (
    <div className="h-full p-8">
      <RunVisualizer />
      <SampleComparator />

      <div className="py-6">
        <div className="text-foreground-800 mb-4 flex w-full items-center justify-between gap-3 pb-6 text-3xl font-bold">
          <h1>All Metagenomics</h1>
          <NewRunForm />
        </div>
        <RunTable />
      </div>
    </div>
  );
}
