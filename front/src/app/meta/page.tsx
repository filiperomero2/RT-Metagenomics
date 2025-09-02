"use client";

import { MetaComparator } from "./comparator";
import { MetaForm } from "./form";
import { MetaTable } from "./table";
import { MetaVisualization } from "./visualization";

export default function Meta() {
  return (
    <div className="h-[calc(100vh-65px)] p-4">
      <MetaVisualization />
      <MetaComparator />

      <div className="bg-content1 rounded-2xl p-4 py-6 shadow-md">
        <div className="text-foreground-800 mb-4 flex w-full items-center justify-between gap-3 pb-6 text-3xl font-bold">
          <h1>All Metagenomics</h1>
          <MetaForm />
        </div>
        <MetaTable />
      </div>
    </div>
  );
}
