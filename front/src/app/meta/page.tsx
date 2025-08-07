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

      <div className="bg-content1 p-4 py-6 rounded-2xl shadow-md">
        <div className="w-full flex justify-between items-center gap-3 mb-4 text-3xl font-bold text-foreground-800 pb-6">
          <h1>All Metagenomics</h1>
          <MetaForm />
        </div>
        <MetaTable />
      </div>
    </div>
  );
}
