import { Button, ButtonGroup } from "@heroui/react";
import { cn } from "@/utils/cn";
import { Copy, ExternalLink, Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

type WindowControlsProps = {
  className?: string;
  closeAction?: "close" | "reattach";
};

export function WindowControls({
  className,
  closeAction = "close",
}: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void window.api.getIsMaximized().then((value) => {
      if (isMounted) {
        setIsMaximized(value);
      }
    });

    const unsubscribe = window.api.onIsMaximized(setIsMaximized);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const isReattachAction = closeAction === "reattach";

  return (
    <div className={cn("flex h-full items-center text-xs", className)}>
      <ButtonGroup variant="ghost">
        <Button
          aria-label="Minimize window"
          onPress={() => window.api.minimizeWindow()}
          isIconOnly
          className="rounded-none"
        >
          <Minus size={16} />
        </Button>
        <Button
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
          onPress={() => window.api.maximizeWindow()}
          className="rounded-none"
          isIconOnly
        >
          {isMaximized ? <Copy size={16} /> : <Square size={16} />}
        </Button>
        <Button
          aria-label={
            isReattachAction ? "Reattach backend monitor" : "Close window"
          }
          onPress={() =>
            isReattachAction
              ? void window.api.reattachBackendMonitorWindow()
              : window.api.closeWindow()
          }
          className={cn(
            "rounded-none",
            isReattachAction ? "hover:bg-accent/15" : "hover:bg-danger",
          )}
          isIconOnly
        >
          {isReattachAction ? (
            <ExternalLink size={16} className="text-foreground rotate-180" />
          ) : (
            <X size={16} className="text-foreground" />
          )}
        </Button>
      </ButtonGroup>
    </div>
  );
}
