import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { getQueryClient } from "./query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider locale="pt-BR">
        <ThemeProvider defaultTheme="dark">
          <ToastProvider placement="top-right" />
          {children}
        </ThemeProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
