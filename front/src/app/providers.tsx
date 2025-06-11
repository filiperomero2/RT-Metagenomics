"use client";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { getQueryClient } from "./get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider locale="pt-BR">
        <NextThemesProvider
          enableSystem={false}
          enableColorScheme={false}
          attribute="class"
          defaultTheme="rt-meta-dark"
          themes={["rt-meta-dark", "rt-meta-light"]}
        >
          <ToastProvider placement="top-right"/>
          {children}
        </NextThemesProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
