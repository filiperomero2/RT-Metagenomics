import { ToastProvider } from "@heroui/react";
import { getQueryClient } from "./query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <ToastProvider />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
