import { cn } from "@/utils/cn";
import {
  type AutocompleteProps,
  Autocomplete as AutocompleteUI,
  ComboBox,
  ComboBoxProps,
  Input,
  Label,
  ListBox,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { useController } from "react-hook-form";

export function Autocomplete<T extends object = object>({
  name,
  label,
  className,
  children,
  ...rest
}: ComboBoxProps<T> & { name: string; label: string }) {
  const [inputValue, setInputValue] = useState("");
  const { field, fieldState } = useController({ name });

  useEffect(() => {
    setInputValue(field.value || "");
  }, [field.value]);

  return (
    <ComboBox
      variant="secondary"
      selectedKey={field.value}
      onSelectionChange={field.onChange}
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
