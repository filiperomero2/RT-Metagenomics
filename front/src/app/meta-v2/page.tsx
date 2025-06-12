"use client";

import { MetaForm } from "./form";
import { MetaTable } from "./table";
import { MetaVisualization } from "./visualization";

export default function Meta() {
  return (
    <div className="h-[calc(100vh-65px)] p-4 space-y-6">
      <MetaVisualization />

      <div className="w-full flex justify-center items-center gap-3 mb-4 text-3xl font-bold text-foreground-800">
        <h1>Metagenomics</h1>
        <MetaForm />
      </div>
      <MetaTable />
    </div>
  );
}
