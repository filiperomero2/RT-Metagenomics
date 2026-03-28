import {
  ComboBox,
  ComboBoxProps,
  FieldError,
  Input,
  Label,
  ListBox
} from "@heroui/react";
import { useController } from "react-hook-form";

export function Autocomplete<T extends object = object>({
  name,
  label,
  className,
  children,
  ...rest
}: ComboBoxProps<T> & { name: string; label: string }) {
  const { field, fieldState } = useController({ name });

  return (
    <ComboBox
      variant="secondary"
      isInvalid={fieldState.invalid}
      {...field}
      {...rest}
    >
      {label && <Label>{label}</Label>}
      <ComboBox.InputGroup>
        <Input />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>{children}</ListBox>
      </ComboBox.Popover>
      <FieldError>{fieldState.error?.message}</FieldError>
    </ComboBox>
  );

  // return (
  //   <AutocompleteUI
  //     size="sm"
  //     variant="flat"
  //     value={inputValue}
  //     isClearable={false}
  //     {...rest}
  //     selectedKey={field.value}
  //     onSelectionChange={field.onChange}
  //     className={cn(!fieldState.invalid && "pb-4", className)}
  //     isInvalid={fieldState.invalid}
  //     errorMessage={fieldState.error?.message}
  //   />
  // );
}
