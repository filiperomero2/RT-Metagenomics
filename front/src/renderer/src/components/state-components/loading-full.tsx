import { Spinner, SpinnerProps } from "@heroui/react";

export function LoadingFull(props: SpinnerProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size="lg" {...props} />
    </div>
  );
}
