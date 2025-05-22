"use client";

import { cn } from "@/utils/cn";
import { type InputProps, Input as InputUI } from "@heroui/react";
import { useController } from "react-hook-form";

export function Input({
  name,
  className,
  ...rest
}: InputProps & { name: string; label?: string }) {
  const { field, fieldState } = useController({ name });

  return (
    <InputUI
      size="sm"
      variant="faded"
      {...rest}
      {...field}
      className={cn(!fieldState.invalid && "pb-4", className)}
      isInvalid={fieldState.invalid}
      errorMessage={fieldState.error?.message}
    />
  );
}
