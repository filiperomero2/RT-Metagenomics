import { cn } from "@/mainview/utils/cn";
import {
  Description,
  Header,
  Label,
  ListBox,
  type SelectProps,
  Select as SelectUI,
} from "@heroui/react";
import { useController } from "react-hook-form";

export function Select({
  name,
  label,
  children,
  ...rest
}: {
  name: string;
  label?: string;
  children?: React.ReactNode;
}) {
  const { field, fieldState } = useController({ name });

  return (
    <SelectUI variant="secondary">
      {label && <Label>{label}</Label>}
      <SelectUI.Trigger>
        <SelectUI.Value />
        <SelectUI.Indicator />
      </SelectUI.Trigger>
      <Description />
      <SelectUI.Popover>
        <ListBox>
          {children}
        </ListBox>
      </SelectUI.Popover>
    </SelectUI>
  );

  // return (
  //   <SelectUI
  //     size="sm"
  //     variant="flat"
  //     {...rest}
  //     {...field}
  //     selectedKeys={[field.value]}
  //     className={cn(!fieldState.invalid && "pb-4", className)}
  //     isInvalid={fieldState.invalid}
  //     errorMessage={fieldState.error?.message}
  //   />
  // );
}
