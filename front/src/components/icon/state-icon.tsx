import { MetaGenomicRun } from "@/types/meta-genomic-run";
import { cn } from "@/utils/cn";
import { Spinner } from "@heroui/react";
import {
  Ban,
  CircleCheck,
  CircleEllipsis,
  CircleX,
  Square
} from "lucide-react";
import { ReactNode } from "react";

const iconColors: Record<MetaGenomicRun["state"], string> = {
  cancelled: "text-danger bg-danger/15",
  completed: "text-success bg-success/15",
  failed: "text-danger bg-danger/15",
  pending: "text-warning bg-warning/15",
  running: "text-primary  bg-primary/15",
};

const stateToIcon: Record<MetaGenomicRun["state"], ReactNode> = {
  cancelled: <Square size={24} />,
  completed: <CircleCheck size={24} />,
  failed: <CircleX size={24} />,
  pending: <CircleEllipsis size={24} />,
  running: <Spinner variant="gradient" size="sm" />,
};

type IconWrapperProps = {
  className?: string;
  state: MetaGenomicRun["state"];
};

export const IconState = ({ className, state }: IconWrapperProps) => (
  <div
    className={cn(
      className,
      iconColors[state],
      "rounded-small flex h-fit w-fit items-center justify-center p-1",
    )}
  >
    {stateToIcon[state]}
  </div>
);
