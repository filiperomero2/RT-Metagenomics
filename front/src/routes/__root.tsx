import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/navigation/header";
import { Providers } from "@/providers";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <Providers>
      <div className="text-foreground bg-background min-h-screen font-sans select-none">
        <Header />
        <Outlet />
      </div>
    </Providers>
  );
}
