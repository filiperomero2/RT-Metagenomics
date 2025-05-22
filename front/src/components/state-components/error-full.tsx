import { CircleX, LucideProps } from "lucide-react";

export function ErrorFull(props: LucideProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <CircleX className="text-danger-300" size={50} {...props} />
    </div>
  );
}
