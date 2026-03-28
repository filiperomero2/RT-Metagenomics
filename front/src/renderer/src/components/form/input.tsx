import { cn } from "@/utils/cn";
import {
  Button,
  FieldError,
  InputGroup,
  type InputProps,
  Label,
  TextField,
  TextFieldProps,
} from "@heroui/react";
import { File } from "lucide-react";
import { useController } from "react-hook-form";

export function Input({
  name,
  className,
  isFolderSelector,
  label,
  ...rest
}: TextFieldProps &
  InputProps & {
    name: string;
    label?: string;
    isFolderSelector?: boolean;
  }) {
  const { field, fieldState } = useController({ name });

  return (
    <TextField
      variant="secondary"
      isInvalid={fieldState.invalid}
      className={cn("w-full", className)}
      {...rest}
      {...field}
    >
      {label && <Label>{label}</Label>}
      <InputGroup>
        <InputGroup.Input />

        {isFolderSelector && (
          <InputGroup.Suffix>
            <Button
              isIconOnly
              variant="tertiary"
              onPress={async () => {
                const path = await window.api.selectFolder();
                if (path) {
                  field.onChange(path);
                }
              }}
            >
              <File />
            </Button>
          </InputGroup.Suffix>
        )}
      </InputGroup>
      <FieldError>{fieldState.error?.message}</FieldError>
    </TextField>
  );
}
