"use client";

import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { MetaGenomicState } from "@/types/meta-genomic-state";
import { cn } from "@/utils/cn";
import {
  Accordion,
  AccordionItem,
  Checkbox,
  Divider,
  ScrollShadow,
  Spinner,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CheckSquare2,
  CircleCheck,
  CircleEllipsis,
  CirclePlay,
  CircleX,
} from "lucide-react";
import { ReactNode } from "react";

type ItemProps = {
  label: ReactNode;
  value: ReactNode;
  span?: boolean;
};

function Item({ value, label, span }: ItemProps) {
  return (
    <div className={cn("flex justify-between px-2", span && "@md:col-span-2")}>
      <span className="font-bold text-sm text-primary-600 line-clamp-1">
        {label}:
      </span>
      <span>{value}</span>
    </div>
  );
}

const stateToIcon: Record<MetaGenomicState["state"], ReactNode> = {
  canceled: <Ban className="text-danger" />,
  completed: <CircleCheck className="text-success" />,
  failed: <CircleX className="text-danger" />,
  pending: <CircleEllipsis className="text-warning" />,
  running: <CirclePlay />,
};

export function MetaList() {
  const { data, isPending, isError, isFetching } = useQuery<MetaGenomicState[]>(
    {
      queryKey: ["list-meta-genomics"],
      refetchInterval: 2000,
      queryFn: async () => {
        const { data } = await api.get<MetaGenomicState[]>("/v1/metagenomics");
        setFocusedMeta(data[0].parameters);
        return data;
      },
    }
  );

  if (isPending) return <LoadingFull />;
  if (isError) return <ErrorFull />;

  return (
    <ScrollShadow
      hideScrollBar
      className="flex flex-col items-center justify-center gap-1 @container"
    >
      <Accordion variant="splitted" defaultExpandedKeys={[data[0].id]} aria-label="Teste">
        {data?.map(({ parameters: meta, id, iteration, state }) => (
          <AccordionItem
            key={id}
            textValue={meta.runName}
            aria-label={meta.runName}
            onPress={() => setFocusedMeta(meta)}
            startContent={
              <div className="flex items-center justify-center">
                {isFetching && ["pending", "running"].includes(state) ? (
                  <Spinner size="sm" />
                ) : (
                  stateToIcon[state]
                )}
              </div>
            }
            title={<p>{meta.runName}</p>}
            subtitle={<p>Interaction {iteration}</p>}
            classNames={{ content: "overflow-x-hidden" }}
          >
            <Divider />
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-3 py-4 w-full p-2">
              <Item label="Data Type" value={meta.dataType} span />
              <Item label="Threads" value={meta.threads} />
              <Item label="Threads Total" value={meta.threadsTotal} />
              <Item
                label="Minimum Read Length"
                value={meta.minimumReadLength}
              />
              <Item label="Trim" value={meta.trim} />

              <Item
                label="Remove Human Reads"
                value={
                  <Checkbox
                    className="-mr-5"
                    isReadOnly
                    color="default"
                    defaultSelected={meta.removeHumanReads}
                  />
                }
              />

              <Item
                label="Remove Unclassified Reads"
                value={
                  <Checkbox
                    className="-mr-5"
                    isReadOnly
                    color="default"
                    defaultSelected={meta.removeUnclassifiedReads}
                  />
                }
              />
            </div>
          </AccordionItem>
        )) || []}
      </Accordion>
    </ScrollShadow>
  );
}
