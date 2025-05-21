import { MetaGenomic } from "@/types/metagenomic";
import { Store, useStore } from "@tanstack/react-store";

const store = new Store({} as MetaGenomic);

export const useFocusedMeta = () => {
  return useStore(store);
};

export const setFocusedMeta = (meta: MetaGenomic) => {
  store.setState(() => meta);
};
