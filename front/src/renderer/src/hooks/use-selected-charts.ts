import { Sample } from "@/types/meta-genomic-run";
import { Store, useStore } from "@tanstack/react-store";

const store = new Store<Sample[]>([]);

const isSameSample = (s1: Sample, s2: Sample) =>
  s1.runId === s2.runId && s1.id === s2.id;

export const useSelectedCharts = () => {
  return useStore(store, (state) => state);
};

export const useIsChartSelected = (sample: Sample) => {
  return !!useStore(store, (state) =>
    state.find((s) => isSameSample(s, sample)),
  );
};

export const clearSelectedCharts = () => {
  store.setState([]);
};

export const toggleSelectedCharts = (sample: Sample) => {
  store.setState((prev) => {
    if (prev.find((s) => isSameSample(s, sample))) {
      return prev.filter((s) => !isSameSample(s, sample));
    }
    return [...prev, sample];
  });
};
