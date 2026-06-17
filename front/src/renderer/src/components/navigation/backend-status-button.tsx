import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { Button, Popover } from "@heroui/react";
import { Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { BackendMonitorPanel } from "./backend-monitor-panel";

export function BackendStatusButton() {
  const { data: backendStatus } = useBackendStatus();
  const [isDetached, setIsDetached] = useState(false);
  const status = backendStatus?.status ?? "offline";
  const health = backendStatus?.health;
  const hasProgress =
    typeof health?.progressStep === "number" &&
    typeof health?.progressTotal === "number" &&
    health.progressTotal > 0;
  const initializingLabel = hasProgress
    ? `Initializing ${health.progressStep}/${health.progressTotal}`
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
      {status === "initializing" ? (
        <span className="text-warning text-xs">{initializingLabel}</span>
      ) : null}
    </Button>
  );

  if (isDetached) {
    return statusButton;
  }

  return (
    <Popover>
      <Popover.Trigger>{statusButton}</Popover.Trigger>
      <Popover.Content>
        <Popover.Dialog className="p-0">
          <BackendMonitorPanel />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
