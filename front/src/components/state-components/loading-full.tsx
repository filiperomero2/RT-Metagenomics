import { Spinner, SpinnerProps } from "@heroui/react";

export function LoadingFull(props: SpinnerProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <Spinner size="md" variant="simple" {...props} />
    </div>
  );
}
