"use client";

import { type CheckboxProps, Checkbox as CheckBoxUI } from "@heroui/react";
import { useController } from "react-hook-form";

export function CheckBox({
  name,
  label,
  ...rest
}: CheckboxProps & { name: string; label?: string }) {
  const { field } = useController({ name });

  return (
    <CheckBoxUI
      {...rest}
      {...field}
      isSelected={field.value}
      onValueChange={field.onChange}
    >
      {label}
    </CheckBoxUI>
  );
}
