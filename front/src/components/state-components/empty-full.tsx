import { Ghost, LucideProps } from "lucide-react";

export function EmptyFull({
  label,
  ...props
}: LucideProps & { label?: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center gap-2 text-default-300">
        <Ghost size={50} {...props} />
        {label && <h1>{label}</h1>}
      </div>
    </div>
  );
}
