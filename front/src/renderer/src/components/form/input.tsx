import { cn } from "@/utils/cn";
import {
  Button,
  FieldError,
  InputGroup,
  type InputProps,
  Label,
  TextField,
  TextFieldProps
} from "@heroui/react";
import { File } from "lucide-react";
import { useController } from "react-hook-form";

export function Input({
  name,
  className,
  isFolderSelector,
  label,
  ...rest
}: TextFieldProps & InputProps & {
  name: string;
  label?: string;
  isFolderSelector?: boolean;
}) {
  const { field, fieldState } = useController({ name });

  return (
    <TextField variant="secondary" {...rest} className={cn("w-full", className)}>
      {label && <Label>{label}</Label>}
      <InputGroup>
        <InputGroup.Input {...field} />

        {isFolderSelector && (
          <InputGroup.Suffix>
            <Button
              isIconOnly
              variant="tertiary"
              onPress={async () => {
                try {
                  const path = ""
                  if (path) {
                    field.onChange(path, {
                      shouldValidate: true,
                    });
                  }
                } catch {
                  // dialog cancelled or Neutralino unavailable
                }
              }}
            >
              <File />
            </Button>
          </InputGroup.Suffix>
        )}
      </InputGroup>

      {fieldState.invalid && (
        <FieldError>{fieldState.error?.message}</FieldError>
      )}
    </TextField>
  );
}
