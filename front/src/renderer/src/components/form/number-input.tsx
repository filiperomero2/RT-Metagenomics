import { Description, FieldError, Label, NumberField } from "@heroui/react";
import { ComponentProps } from "react";
import { useController } from "react-hook-form";

export function NumberInput({
  name,
  label,
  description,
  ...rest
}: ComponentProps<typeof NumberField.Input> & {
  name: string;
  label?: string;
  description?: string;
}) {
  const { field, fieldState } = useController({ name });

  return (
    <NumberField {...field} variant="secondary" isInvalid={fieldState.invalid}>
      <Label>{label}</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input {...rest} />
        <NumberField.IncrementButton />
      </NumberField.Group>
      {description && <Description>{description}</Description>}
      <FieldError>{fieldState.error?.message}</FieldError>
    </NumberField>
  );
}
