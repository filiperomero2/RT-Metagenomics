// app/providers.tsx

import { HeroUIProvider } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <HeroUIProvider locale="pt-BR">{children}</HeroUIProvider>;
}
