import { Button, ButtonGroup } from "@heroui/react";
import { cn } from "@/utils/cn";
import { isMac } from "@/utils/platform";
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

  if (isMac) {
    return (
      <div className={cn("flex h-full items-center text-xs", className)}>
        <div className="app-no-drag flex items-center gap-2 px-3">
          <button
            type="button"
            aria-label={
              isReattachAction ? "Reattach backend monitor" : "Close window"
            }
            onClick={() =>
              isReattachAction
                ? void window.api.reattachBackendMonitorWindow()
                : window.api.closeWindow()
            }
            className="group bg-[#ff5f57] ring-black/10 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 transition-transform hover:scale-105"
          >
            {isReattachAction ? (
              <ExternalLink
                size={8}
                className="text-black/65 rotate-180 opacity-0 transition-opacity group-hover:opacity-100"
              />
            ) : (
              <X
                size={8}
                className="text-black/65 opacity-0 transition-opacity group-hover:opacity-100"
              />
            )}
          </button>
          <button
            type="button"
            aria-label="Minimize window"
            onClick={() => window.api.minimizeWindow()}
            className="group bg-[#ffbd2e] ring-black/10 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 transition-transform hover:scale-105"
          >
            <Minus
              size={8}
              className="text-black/65 opacity-0 transition-opacity group-hover:opacity-100"
            />
          </button>
          <button
            type="button"
            aria-label={isMaximized ? "Restore window" : "Maximize window"}
            onClick={() => window.api.maximizeWindow()}
            className="group bg-[#28c840] ring-black/10 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-1 transition-transform hover:scale-105"
          >
            {isMaximized ? (
              <Copy
                size={8}
                className="text-red-300/65 opacity-0 transition-opacity group-hover:opacity-100 "
              />
            ) : (
              <Square
                size={7}
                className="text-black/65 opacity-0 transition-opacity group-hover:opacity-100"
              />
            )}
          </button>
        </div>
      </div>
    );
  }

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
          {isMaximized ? <Copy size={16} className="-rotate-90" /> : <Square size={16} />}
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
