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
      "flex items-center rounded-small justify-center w-fit p-1 "
    )}
  >
    {children}
  </div>
);
