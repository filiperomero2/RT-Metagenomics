import { MetaGenomic } from "./meta-genomic";

export interface MetaGenomicState {
  id: number;
  state: "pending" | "running" | "completed" | "failed" | "canceled";
  iteration: number;
  parameters: MetaGenomic;
}
