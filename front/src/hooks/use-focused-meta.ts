import { MetaGenomic } from "@/types/meta-genomic";
import { Store, useStore } from "@tanstack/react-store";

const store = new Store({} as MetaGenomic);

export const useFocusedMeta = () => {
  return useStore(store);
};

export const setFocusedMeta = (meta: MetaGenomic) => {
  store.setState(() => meta);
};
