import { Button, Skeleton } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronRight,
  Maximize,
  Minimize,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { cn } from "@/utils/cn";
import { ShowComponent } from "./show-components";
import { LoadingFull } from "./state-components/loading-full";

interface AccordionProps {
  show?: boolean;
  toggle?: () => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  fitContent?: boolean;
  isLoading?: boolean;
  stateIndicator?: "warning" | "error" | "success";
  actions?: {
    icon: React.ReactNode;
    active?: boolean;
    label: string;
    onPress: () => void;
  }[];
}

export function Accordion({
  show,
  children,
  toggle,
  title,
  actions,
  className,
  fitContent,
  isLoading,
  stateIndicator,
}: AccordionProps) {
  const uniqueId = useId();
  const [isFullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    document.addEventListener("fullscreenchange", (e) => {
      setFullScreen(document.fullscreenElement?.id === uniqueId);
    });
    return () => document.removeEventListener("fullscreenchange", () => { });
  }, []);

  const handleFullScreen = () => {
    const element = document.getElementById(uniqueId);
    if (!isFullScreen) {
      element?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      className="scrollbar-hide flex w-full snap-center flex-col overflow-auto"
      id={uniqueId}
    >
      <div
        className={cn(
          "bg-content2/60 text-content2-foreground sticky top-0 z-10 mx-auto flex w-full  items-center justify-between gap-2 overflow-clip rounded-xl px-4 py-1.5 shadow backdrop-blur-2xl",
          isFullScreen && "rounded-t-none",
          {
            "border-warning border-l-2": stateIndicator === "warning",
            "border-danger border-l-2": stateIndicator === "error",
            "border-success border-l-2": stateIndicator === "success",
          },
        )}
      >
        <div className="z-10 flex w-full items-center">

          {toggle && !isFullScreen && (
            <motion.div animate={{ rotateZ: show ? 90 : 0 }}>
              <Button isIconOnly variant="light" onPress={toggle}>
                <ChevronRight className="text-foreground-700" />
              </Button>
            </motion.div>
          )}

          <div className="flex flex-1 items-center">
            {title}
          </div>

          <div className="relative flex items-center gap-1">
            {actions?.map((action) => (
              <Button
                key={action.label}
                onPress={action.onPress}
                size="sm"
                variant={action.active ? "shadow" : "light"}
                color={action.active ? "primary" : "default"}
                startContent={action.icon}
                className="text-foreground-700"
              >
                {action.label}
              </Button>
            ))}

            <Button
              onPress={handleFullScreen}
              isIconOnly
              size="sm"
              variant="light"
              className="ml-2"
            >
              {isFullScreen ? (
                <Minimize className="text-foreground-700" />
              ) : (
                <Maximize className="text-foreground-700" />
              )}
            </Button>
          </div>
        </div>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              className="absolute inset-0 z-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Skeleton className="absolute inset-0 z-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <ShowComponent
        show={show || isFullScreen}
        gridClassName={cn("h-full")}
        initial={false}
        gridInnerClassName={fitContent ? "h-fit" : undefined}
      >
        <div
          className={cn(
            "bg-content2/70 mt-1 overflow-clip rounded-xl",
            className,
          )}
          data-fullscreen={isFullScreen}
        >
          {isLoading && <LoadingFull />}
          {children}
        </div>
      </ShowComponent>
    </div>
  );
}
