import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { Button, Popover } from "@heroui/react";
import { Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { BackendMonitorPanel } from "./backend-monitor-panel";

export function BackendStatusButton() {
  const { data: backendStatus } = useBackendStatus();
  const [isDetached, setIsDetached] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const status = backendStatus?.status ?? "offline";
  const health = backendStatus?.health;
  const isBootstrapping = health?.phase === "bootstrapping_databases";
  const hasProgress =
    typeof health?.progressStep === "number" &&
    typeof health?.progressTotal === "number" &&
    health.progressTotal > 0;
  const initializingLabel =
    status === "degraded" && !isBootstrapping
      ? health?.error?.trim() || health?.progressText || "Degraded"
      : hasProgress && health?.progressText
        ? health.progressText
        : hasProgress
          ? `Step ${health.progressStep}/${health.progressTotal}`
          : isBootstrapping
            ? "Setting up databases"
            : "Initializing";

  useEffect(() => {
    let cancelled = false;

    void window.api.getBackendMonitorWindowState().then((isOpen) => {
      if (!cancelled) {
        setIsDetached(isOpen);
      }
    });

    const unsubscribe = window.api.onBackendMonitorWindowState((isOpen) => {
      setIsDetached(isOpen);
      if (isOpen) {
        setPopoverOpen(false);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const statusButton = (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Backend status"
      onPress={
        isDetached
          ? () => void window.api.openBackendMonitorWindow()
          : undefined
      }
    >
      <Circle
        size={18}
        className={cn(
          "fill-success text-success",
          status === "offline" && "fill-danger text-danger",
          status === "initializing" && "fill-warning text-warning",
          status === "degraded" && "fill-warning text-warning",
        )}
      />
      {status === "initializing" || status === "degraded" || isBootstrapping ? (
        <span
          className={cn(
            "max-w-48 truncate text-xs",
            status === "degraded" ? "text-warning" : "text-warning",
          )}
        >
          {initializingLabel}
        </span>
      ) : null}
    </Button>
  );

  return (
    <Popover
      isNonModal
      isOpen={!isDetached && popoverOpen}
      onOpenChange={(open) => {
        if (!isDetached) {
          setPopoverOpen(open);
        }
      }}
    >
      <Popover.Trigger>{statusButton}</Popover.Trigger>
      <Popover.Content className="w-[min(42rem,calc(100vw-2rem))]">
        <Popover.Dialog className="p-0">
          <BackendMonitorPanel
            logViewportClassName="h-[50vh] w-full"
            onBeforeDetach={() => setPopoverOpen(false)}
          />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
