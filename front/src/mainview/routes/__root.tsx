import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/mainview/components/navigation/header";
import { Providers } from "@/mainview/providers";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <Providers>
      <div className="text-foreground min-h-screen font-sans select-none bg-surface">
        <Header />
        <div className="border-3 border-surface-secondary min-h-[calc(100vh-2.75rem)] bg-background rounded-3xl overflow-hidden">
          <Outlet />
        </div>
      </div>
    </Providers>
  );
}
