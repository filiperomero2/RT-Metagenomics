"use client";

import { cn } from "@/utils/cn";
import {
  type NumberInputProps,
  NumberInput as NumberInputUI,
} from "@heroui/react";
import { useController } from "react-hook-form";

export function NumberInput({
  name,
  className,
  ...rest
}: NumberInputProps & { name: string; label?: string }) {
  const { field, fieldState } = useController({ name });

  return (
    <NumberInputUI
      size="sm"
      variant="flat"
      {...rest}
      {...field}
      className={cn(!fieldState.invalid && "pb-4", className)}
      isInvalid={fieldState.invalid}
      errorMessage={fieldState.error?.message}
    />
  );
}
