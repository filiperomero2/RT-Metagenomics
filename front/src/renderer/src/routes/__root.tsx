import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/navigation/header";
import { Providers } from "@/providers";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <Providers>
      <div className="text-foreground min-h-screen font-sans select-none bg-surface">
        <Header />
        <div className="border-t-3 border-surface-secondary h-[calc(100vh-2.75rem)] bg-background rounded-t-2xl overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </Providers>
  );
}
