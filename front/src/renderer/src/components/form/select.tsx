import {
  Description,
  FieldError,
  Label,
  ListBox,
  Select as SelectUI
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
    <SelectUI variant="secondary" {...rest} {...field} isInvalid={fieldState.invalid}>
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
      <FieldError>{fieldState.error?.message}</FieldError>
    </SelectUI>
  );

}
