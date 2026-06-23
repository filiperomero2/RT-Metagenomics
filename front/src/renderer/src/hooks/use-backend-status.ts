import type { BackendProcessEvent } from "../../../shared/types/backend";
import { api } from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const BACKEND_STATE_QUERY_KEY = ["backend-state"] as const;
const HEALTH_QUERY_KEY = ["backend-health"] as const;

export type BackendUiStatus = "offline" | "initializing" | "ready" | "degraded";

type BackendHealthResponse = {
  status: string;
  timestamp: string;
  phase?:
    | "starting"
    | "bootstrapping_databases"
    | "starting_worker"
    | "ready"
    | "degraded";
  progressStep?: number;
  progressTotal?: number;
  progressText?: string;
  error?: string | null;
  startedAt?: string;
  updatedAt?: string;
};

type BackendStatusData = {
  status: BackendUiStatus;
  isRunningProcess: boolean;
  health: BackendHealthResponse | null;
};

function toOnlineState(event: BackendProcessEvent) {
  return event.type === "started" || event.type === "attached";
}

export function useBackendStatus() {
  const queryClient = useQueryClient();

  useEffect(() => {
    return window.api.onBackendProcessEvent((event) => {
      queryClient.setQueryData(BACKEND_STATE_QUERY_KEY, toOnlineState(event));
    });
  }, [queryClient]);

  const processStateQuery = useQuery({
    queryKey: BACKEND_STATE_QUERY_KEY,
    queryFn: async () => {
      const state = await window.api.getBackendState();
      return state.isRunning;
    },
    refetchInterval: 3000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  const healthQuery = useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<BackendHealthResponse>("/v1/health");
      return response.data;
    },
    refetchInterval: 2000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const isRunningProcess = processStateQuery.data === true;
  const health = healthQuery.isSuccess ? healthQuery.data : null;
  const healthReachable = healthQuery.isSuccess;

  let status: BackendUiStatus = "offline";
  if (isRunningProcess || healthReachable) {
    const phase = health?.phase;
    if (phase === "degraded") {
      status = "degraded";
    } else if (phase === "ready") {
      status = "ready";
    } else {
      status = "initializing";
    }
  }

  return {
    ...processStateQuery,
    data: {
      status,
      isRunningProcess: isRunningProcess || healthReachable,
      health,
    } as BackendStatusData,
    isLoading: processStateQuery.isLoading,
    isFetching: processStateQuery.isFetching || healthQuery.isFetching,
    isError: processStateQuery.isError && healthQuery.isError,
  };
}
