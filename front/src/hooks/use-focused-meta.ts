import { MetaGenomic } from "@/types/meta-genomic";
import { MetaGenomicState } from "@/types/meta-genomic-state";
import { Store, useStore } from "@tanstack/react-store";

const store = new Store({} as MetaGenomicState);

export const useFocusedMeta = () => {
  return useStore(store);
};

export const setFocusedMeta = (meta: MetaGenomicState) => {
  store.setState(() => meta);
};
