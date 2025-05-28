import { EmptyFull } from "@/components/state-components/empty-full";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { useFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

export function MetaVisualization() {
  const { id } = useFocusedMeta();
  const { data, isPending, isError } = useQuery({
    enabled: id !== undefined,
    queryKey: ["meta-visualization", id],
    queryFn: async () => {
      const response = await api.get(`v1/metagenomics/${id}/result`);
      return response.data;
    },
  });
  
  if (!id) return <EmptyFull label="No metagenomic selected" />;
  if (isPending) return <LoadingFull />;
  if (isError) return <ErrorFull label="Visualization not ready"/>;

  return (
    <div className="w-full h-full relative p-2">
      <iframe srcDoc={data} className="w-full h-full rounded-xl" />
    </div>
  );
}
