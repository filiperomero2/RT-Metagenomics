"use client";

import { cn } from "@/utils/cn";
import { type SelectProps, Select as SelectUI } from "@heroui/react";
import { useController } from "react-hook-form";

export function Select({
  name,
  className,
  ...rest
}: SelectProps & { name: string; label?: string }) {
  const { field, fieldState } = useController({ name });

  return (
    <SelectUI
      variant="faded"
      {...rest}
      {...field}
      className={cn(!fieldState.invalid && "pb-6", className)}
      isInvalid={fieldState.invalid}
      errorMessage={fieldState.error?.message}
    />
  );
}
