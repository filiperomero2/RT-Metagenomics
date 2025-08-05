import { MetaGenomic } from "./meta-genomic";

export interface MetaGenomicState {
  id: number;
  state: "pending" | "running" | "completed" | "failed" | "canceled";
  iteration: number;
  name: string;
  parameters: Omit<MetaGenomic, "runName" | "samples">;
}
