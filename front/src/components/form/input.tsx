import { cn } from "@/utils/cn";
import {
  Button,
  FieldError,
  InputGroup,
  type InputProps,
  Input as InputUI,
  Label,
  TextField,
} from "@heroui/react";
import { useController } from "react-hook-form";
import { File } from "lucide-react";

export function Input({
  name,
  className,
  isFolderSelector,
  label,
  ...rest
}: InputProps & { name: string; label?: string; isFolderSelector?: boolean }) {
  const { field, fieldState } = useController({ name });

  return (
    <TextField variant="secondary">
      {label && <Label>{label}</Label>}
      <InputGroup>
        <InputGroup.Input {...rest} {...field} />

        {isFolderSelector && (
          <InputGroup.Suffix>
            <Button
              isIconOnly
              variant="tertiary"
              onPress={async () => {
                try {
                  const path =
                    await Neutralino.os.showFolderDialog("Select Data Folder");
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
              <File  />
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
