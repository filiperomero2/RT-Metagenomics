import { EmptyFull } from "@/components/state-components/empty-full";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { useFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { queryKeys } from "@/utils/query-keys-factory";
import { Chip } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

export function MetaVisualization() {
  const focused = useFocusedMeta();
  const { data, isPending, isError } = useQuery({
    enabled: !!focused?.id,
    queryKey: queryKeys.getMetaGenomic(Number(focused?.id)),
    queryFn: async () => {
      const response = await api.get(`v1/metagenomics/${focused!.id}/result`);
      return response.data;
    },
  });


  if (!focused?.id) return <EmptyFull label="No metagenomic selected" />;
  if (isPending) return <LoadingFull />;
  if (isError) return <ErrorFull label="Visualization not ready" />;

  return (
    <div className="w-full h-full relative p-2 space-y-2 overflow-y-auto snap-y ">
      <div className="w-full h-full overflow-hidden rounded-xl relative snap-center">
        <iframe srcDoc={data} className="w-full h-full rounded-xl bg-white" />
        <div className="absolute right-2 bottom-2">
          <Chip variant="faded">Sample 4117</Chip>
        </div>
      </div>
    </div>
  );
}
