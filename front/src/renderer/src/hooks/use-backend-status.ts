import type { BackendProcessEvent } from "../../../shared/types/backend";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const BACKEND_STATE_QUERY_KEY = ["backend-state"] as const;

function toOnlineState(event: BackendProcessEvent) {
  return event.type === "started";
}

export function useBackendStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return window.api.onBackendProcessEvent((event) => {
      queryClient.setQueryData(BACKEND_STATE_QUERY_KEY, toOnlineState(event));
    });
  }, [queryClient]);

  return useQuery({
    queryKey: BACKEND_STATE_QUERY_KEY,
    queryFn: async () => {
      const state = await window.api.getBackendState();
      return state.isRunning;
    },
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
