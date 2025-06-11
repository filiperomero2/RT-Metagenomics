import { cn } from "@/utils/cn";
import { ReactNode } from "react";

type IconWrapperProps = {
  children: ReactNode;
  className?: string;
};

export const IconWrapper = ({ children, className }: IconWrapperProps) => (
  <div
    className={cn(
      className,
      "flex items-center rounded-small justify-center w-8 h-8"
    )}
  >
    {children}
  </div>
);
