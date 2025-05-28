"use client";

import { HeroUIProvider } from "@heroui/react";
import { getQueryClient } from "./get-query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import {ThemeProvider as NextThemesProvider} from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <HeroUIProvider locale="pt-BR">
        <NextThemesProvider attribute="class" defaultTheme="rt-meta-dark" themes={["rt-meta-dark", "rt-meta-light"]}>
          {children}
        </NextThemesProvider>
      </HeroUIProvider>
    </QueryClientProvider>
  );
}
