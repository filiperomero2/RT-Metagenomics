import { Ghost, LucideProps } from "lucide-react";

export function EmptyFull(props: LucideProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <Ghost className="text-default-300" size={50} {...props} />
    </div>
  );
}
