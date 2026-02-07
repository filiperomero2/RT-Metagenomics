import { Ghost, LucideProps } from "lucide-react";

export function EmptyFull({
  label,
  ...props
}: LucideProps & { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-default-300 flex flex-col items-center justify-center gap-2">
        <Ghost size={50} {...props} />
        {label && <h1>{label}</h1>}
      </div>
    </div>
  );
}
