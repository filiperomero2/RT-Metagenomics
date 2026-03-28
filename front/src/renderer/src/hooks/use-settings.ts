import { api } from "@/lib/axios";
import { queryKeys } from "@/utils/query-keys-factory";
import { type SettingsData, mergeSettings } from "@/types/settings";
import { useMutation, useQuery } from "@tanstack/react-query";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.getSettings(),
    queryFn: async () => {
      const response = await api.get<SettingsData>("/v1/config");
      return mergeSettings(response.data);
    },
  });
}

export function useSaveSettings() {
  return useMutation({
    mutationFn: async (settings: SettingsData) => {
      const response = await api.put<SettingsData>("/v1/config", settings);
      return mergeSettings(response.data);
    },
    meta: {
      invalidatesQuery: queryKeys.getSettings(),
      errorMessage: {
        title: "Settings",
        description: "Failed to save settings.",
      },
    },
  });
}

export function useUpdateKronaDatabase() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ status: string }>(
        "/v1/databases/krona/update",
      );
      return response.data;
    },
    meta: {
      successMessage: {
        title: "Krona Database",
        description: "Krona database update started successfully.",
      },
      errorMessage: {
        title: "Krona Database",
        description: "Failed to update the Krona database.",
      },
    },
  });
}
