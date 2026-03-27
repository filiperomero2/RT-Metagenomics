import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export function useBackendStatus() {
  return useQuery({
    queryKey: ["backend-health"],
    refetchInterval: 5000,
    retry: false,
    queryFn: async () => {
      const response = await api.get("/health");
      return response.data;
    },
    select: () => true as const,
  });
}
