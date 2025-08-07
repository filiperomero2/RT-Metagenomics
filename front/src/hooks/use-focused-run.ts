import { MetaGenomic } from "@/types/meta-genomic";
import { MetaGenomicState } from "@/types/meta-genomic-state";
import { Store, useStore } from "@tanstack/react-store";

const store = new Store<MetaGenomicState | undefined>(undefined);

export const useFocusedRun = () => {
  return useStore(store, (state) => state);
};

export const setFocusedRun = (meta: MetaGenomicState | undefined) => {
  store.setState(() => meta);
};
