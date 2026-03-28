import { useBackendStatus } from "@/hooks/use-backend-status";
import { cn } from "@/utils/cn";
import { Button, Popover } from "@heroui/react";
import { Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { BackendMonitorPanel } from "./backend-monitor-panel";

export function BackendStatusButton() {
  const { data: isUp, isError } = useBackendStatus();
  const [isDetached, setIsDetached] = useState(false);

  const isRunning = isUp && !isError;

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
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label="Backend status"
      onPress={isDetached ? () => void window.api.openBackendMonitorWindow() : undefined}
    >
      <Circle
        size={18}
        className={cn(
          "fill-success text-success",
          !isRunning && "fill-danger text-danger",
        )}
      />
    </Button>
  );

  if (isDetached) {
    return statusButton;
  }

  return (
    <Popover>
      <Popover.Trigger>{statusButton}</Popover.Trigger>
      <Popover.Content>
        <Popover.Dialog>
          <BackendMonitorPanel />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
