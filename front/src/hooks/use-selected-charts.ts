import { Store, useStore } from "@tanstack/react-store";

const store = new Store<number[]>([]);

export const useSelectedCharts = () => {
  return useStore(store, (state) => state);
};

export const useIsChartSelected = (id: number) => {
  return useStore(store, (state) => state.includes(id));
};

export const clearSelectedCharts = () => {
  store.setState([]);
};

export const toggleSelectedCharts = (id: number) => {
  store.setState((prev) => {
    if (prev.includes(id)) {
      return prev.filter((chartId) => chartId !== id);
    }
    return [...prev, id];
  });
};
