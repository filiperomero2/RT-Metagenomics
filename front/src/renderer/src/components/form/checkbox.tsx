import { cn } from "@/utils/cn";
import {
  type CheckboxProps,
  Checkbox as CheckBoxUI,
  Description,
  Label,
  TextField,
  Switch,
  Surface,
} from "@heroui/react";
import { useController } from "react-hook-form";

export function CheckBox({
  name,
  label,
  ...rest
}: CheckboxProps & { name: string; label?: string }) {
  const { field, fieldState } = useController({ name });

  // implement using switch

  return (
    <Surface variant="tertiary" className="mt-2 w-full rounded-xl px-1 py-3">
      <CheckBoxUI
        {...field}
        isInvalid={fieldState.invalid}
        name={name}
        className="w-full px-2"
        {...rest}
      >
        <CheckBoxUI.Control>
          <CheckBoxUI.Indicator />
        </CheckBoxUI.Control>
        <CheckBoxUI.Content>
          {label && <Label htmlFor={name}>{label}</Label>}
        </CheckBoxUI.Content>
      </CheckBoxUI>
    </Surface>
  );
}
