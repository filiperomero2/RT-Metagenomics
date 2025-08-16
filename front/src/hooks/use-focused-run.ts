import { MetaGenomicRun } from "@/types/meta-genomic-run";
import { Store, useStore } from "@tanstack/react-store";

const store = new Store<MetaGenomicRun | undefined>(undefined);

export const useFocusedRun = () => {
  return useStore(store, (state) => state);
};

export const setFocusedRun = (meta: MetaGenomicRun | undefined) => {
  store.setState(() => meta);
};
