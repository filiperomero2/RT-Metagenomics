import { BackendMonitorPanel } from "@/components/navigation/backend-monitor-panel";
import { DetachedWindowHeader } from "@/components/navigation/detached-window-header";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/backend-monitor")({
  component: BackendMonitorRoute,
});

function BackendMonitorRoute() {
  return (
    <>
      <DetachedWindowHeader />
      <div className="border-accent/30 bg-background from-background to-surface/80 h-[calc(100vh-2.75rem)] overflow-hidden rounded-t-2xl border-t bg-gradient-to-b p-4">
        <BackendMonitorPanel
          detached
          autoStart={false}
          className="border-accent/20 h-full rounded-xl border shadow-lg"
          logViewportClassName="h-full w-full"
        />
      </div>
    </>
  );
}
