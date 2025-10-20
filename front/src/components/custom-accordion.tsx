import { useEffect, useId, useState } from "react";
import { ShowComponent } from "./show-components";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Progress, Skeleton, Spinner } from "@heroui/react";
import { ChevronRight, Maximize, Minimize } from "lucide-react";
import { cn } from "@/utils/cn";
import { IconState } from "./icon/state-icon";

interface AccordionProps {
  show?: boolean;
  toggle?: () => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  fitContent?: boolean;
  isLoading?: boolean;
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
}: AccordionProps) {
  const uniqueId = useId();
  const [isFullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    document.addEventListener("fullscreenchange", (e) => {
      setFullScreen(document.fullscreenElement?.id === uniqueId);
    });
    return () => document.removeEventListener("fullscreenchange", () => {});
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
      className="flex w-full snap-center flex-col overflow-auto scrollbar-hide"
      id={uniqueId}
    >
      <div
        className={cn(
          "bg-content2/60 text-content2-foreground sticky top-0 z-10 mx-auto flex w-full items-center justify-between gap-2 overflow-clip rounded-xl px-4 py-1.5 shadow",
          isFullScreen && "rounded-t-none",
        )}
      >
        {/* <Progress isIndeterminate size="sm" color="warning" className="absolute bottom-0 left-0" /> */}
        <div className="z-10 flex w-full items-center">
          {toggle && !isFullScreen && (
            <motion.div animate={{ rotateZ: show ? 90 : 0 }}>
              <Button isIconOnly variant="light" onPress={toggle}>
                <ChevronRight />
              </Button>
            </motion.div>
          )}
          <div className="flex flex-1">{title}</div>

          <div className="relative flex items-center gap-1">
            {actions?.map((action) => (
              <Button
                key={action.label}
                onPress={action.onPress}
                size="sm"
                variant={action.active ? "shadow" : "light"}
                color={action.active ? "primary" : "default"}
                startContent={action.icon}
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
              {isFullScreen ? <Minimize /> : <Maximize />}
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
          className={cn("bg-content2/70 mt-1 rounded-xl", className)}
          data-fullscreen={isFullScreen}
        >
          {children}
        </div>
      </ShowComponent>
    </div>
  );
}
