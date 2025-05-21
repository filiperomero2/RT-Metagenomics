import { useFocusedMeta } from "@/hooks/use-focused-meta";

export function MetaVisualization() {
  const { runName } = useFocusedMeta();

  return <div className="p-72 bg-primary rounded-full">{runName}</div>;
}
