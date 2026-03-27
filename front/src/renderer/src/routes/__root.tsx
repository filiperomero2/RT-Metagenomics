import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/navigation/header";
import { Providers } from "@/providers";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <Providers>
      <div className="text-foreground bg-surface min-h-screen font-sans select-none">
        <Header />
        <div
          id="content"
          className="border-accent/30 bg-background from-background to-surface/80 h-[calc(100vh-2.75rem)] overflow-y-auto rounded-t-2xl border-t-1 bg-gradient-to-b"
        >
          <Outlet />
        </div>
      </div>
    </Providers>
  );
}
