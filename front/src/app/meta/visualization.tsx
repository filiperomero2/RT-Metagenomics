import { EmptyFull } from "@/components/state-components/empty-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { useFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { useEffect, useState } from "react";

const baseUrl = api.defaults.baseURL;

export function MetaVisualization() {
  const [loading, setLoading] = useState(true);
  const { id } = useFocusedMeta();

  useEffect(() => {
    if (id) setLoading(true);
  }, [id]);

  const handleLoad = () => {
    setLoading(false);
  };

  if (!id) return <EmptyFull label="No metagenomic selected" />;

  return (
    <div className="w-full h-full relative p-2">
      {loading && (
        <div className="absolute inset-0">
          <LoadingFull />
        </div>
      )}
      <iframe
        src={`${baseUrl}v1/metagenomics/${id}/result`}
        className="w-full h-full rounded-xl"
        onLoad={handleLoad}
      />
    </div>
  );
}
