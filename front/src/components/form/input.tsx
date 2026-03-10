import { cn } from "@/utils/cn";
import { Button, type InputProps, Input as InputUI } from "@heroui/react";
import { useController } from "react-hook-form";
import { File } from "lucide-react";

export function Input({
  name,
  className,
  isFolderSelector,
  ...rest
}: InputProps & { name: string; label?: string; isFolderSelector?: boolean }) {
  const { field, fieldState } = useController({ name });

  return (
    <InputUI
      size="sm"
      variant="flat"
      {...rest}
      {...field}
      className={cn(!fieldState.invalid && "pb-4", className)}
      isInvalid={fieldState.invalid}
      errorMessage={fieldState.error?.message}
      endContent={
        isFolderSelector ? (
          <Button
            isIconOnly
            size="sm"
            onPress={async () => {
              try {
                const path =
                  await Neutralino.os.showFolderDialog("Select Data Folder");
                if (path) {
                  field.onChange("path", path, {
                    shouldValidate: true,
                  });
                }
              } catch {
                // dialog cancelled or Neutralino unavailable
              }
            }}
          >
            <File size={16} />
          </Button>
        ) : (
          rest.endContent
        )
      }
    />
  );
}
