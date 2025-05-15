"use client";

import { cn } from "@/utils/cn";
import { type CheckboxProps, Checkbox as CheckBoxUI } from "@heroui/react";
import { useController } from "react-hook-form";

export function CheckBox({
  name,
  className,
  label,
  ...rest
}: CheckboxProps & { name: string; label?: string }) {
  const { field, fieldState } = useController({ name });

  return (
    <CheckBoxUI
      {...rest}
      {...field}
      className={cn(!fieldState.invalid && "pb-6", className)}
      isInvalid={fieldState.invalid}
      errorMessage={fieldState.error?.message}
    >
      {label}
    </CheckBoxUI>
  );
}
