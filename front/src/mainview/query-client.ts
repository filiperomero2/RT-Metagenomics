import { toast } from "@heroui/react";
import { MutationCache, QueryClient, QueryKey } from "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      invalidatesQuery?: QueryKey;
      successMessage?: {
        title?: string;
        description?: string;
      };
      errorMessage?: {
        title?: string;
        description?: string;
      };
    };
  }
}

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage) {
          toast.success(mutation.meta.successMessage.description);
        }
      },
      onError: (_error, _variables, _context, mutation) => {
        if (mutation.meta?.errorMessage) {
          toast.danger(mutation.meta.errorMessage.description);
        }
      },
      onSettled: (_data, _error, _variables, _context, mutation) => {
        if (mutation.meta?.invalidatesQuery) {
          queryClient.invalidateQueries({
            queryKey: mutation.meta?.invalidatesQuery,
          });
        }
      },
    }),
  });
  return queryClient;
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
