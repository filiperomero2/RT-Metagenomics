import { MetaGenomicRun } from "@/types/meta-genomic-run";
import { cn } from "@/utils/cn";
import { ReactNode } from "react";
import {
  Ban,
  CircleCheck,
  CircleEllipsis,
  CircleX,
  Trash2,
} from "lucide-react";
import { Spinner } from "@heroui/react";

const iconColors: Record<MetaGenomicRun["state"], string> = {
  canceled: "text-danger bg-danger/15",
  completed: "text-success bg-success/15",
  failed: "text-danger bg-danger/15",
  pending: "text-warning bg-warning/15",
  running: "text-primary  bg-primary/15",
};

const stateToIcon: Record<MetaGenomicRun["state"], ReactNode> = {
  canceled: <Ban size={24} />,
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
      "flex items-center rounded-small justify-center w-fit p-1 "
    )}
  >
    {stateToIcon[state]}
  </div>
);
