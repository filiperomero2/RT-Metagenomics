import { useEffect, useId, useState } from "react";
import { ShowComponent } from "./show-components";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@heroui/react";
import { ChevronRight, Maximize, Minimize } from "lucide-react";
import { cn } from "@/utils/cn";

interface AccordionProps {
  show?: boolean;
  toggle?: () => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  fitContent?: boolean;
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
      className="bg-content1 flex w-full snap-center flex-col overflow-auto"
      id={uniqueId}
    >
      <div
        className={cn(
          "bg-content2/60 text-content2-foreground sticky top-0 z-10 mx-auto flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2 shadow",
          isFullScreen && "rounded-t-none",
        )}
      >
        <div className="flex w-full items-center">
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
