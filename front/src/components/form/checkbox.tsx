"use client";

import { cn } from "@/utils/cn";
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
      style={{ color: `hsl(var(--heroui-${rest.color}) / 1)` }}
      classNames={{
        base: cn(
          "inline-flex w-full max-w-md bg-content2 py-2.5 gap-1 m-0 mb-4 px-2",
          "hover:bg-content3 items-center justify-start",
          "cursor-pointer rounded-lg border-2 border-transparent",
          "data-[selected=true]:border-current/20 data-[selected=true]:bg-current/20",
        ),
        label: "w-full ml-1",
        wrapper: "mr-0"
      }}
      isSelected={field.value}
      onValueChange={field.onChange}
    >
      {label}
    </CheckBoxUI>
  );
}
