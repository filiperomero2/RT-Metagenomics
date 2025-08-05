"use client";

import { cn } from "@/utils/cn";
import {
  type AutocompleteProps,
  Autocomplete as AutocompleteUI,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { useController } from "react-hook-form";

export function Autocomplete<T extends object = object>({
  name,
  className,
  ...rest
}: AutocompleteProps<T> & { name: string }) {
  const [inputValue, setInputValue] = useState("");
  const { field, fieldState } = useController({ name });

  useEffect(() => {
    setInputValue(field.value || "");
  }, [field.value]);

  return (
    <AutocompleteUI
      size="sm"
      variant="faded"
      value={inputValue}
      isClearable={false}
      {...rest}
      selectedKey={field.value}
      onSelectionChange={field.onChange}
      className={cn(!fieldState.invalid && "pb-4", className)}
      isInvalid={fieldState.invalid}
      errorMessage={fieldState.error?.message}
    />
  );
}
