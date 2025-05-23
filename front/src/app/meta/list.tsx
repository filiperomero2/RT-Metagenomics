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

type IconWrapperProps = {
  children: ReactNode;
  className?: string;
};

export const IconWrapper = ({ children, className }: IconWrapperProps) => (
  <div
    className={cn(
      className,
      "flex items-center rounded-small justify-center w-8 h-8"
    )}
  >
    {children}
  </div>
);

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

const iconColors: Record<MetaGenomicState["state"], string> = {
  canceled: "text-danger bg-danger/15",
  completed: "text-success bg-success/15",
  failed: "text-danger bg-danger/15",
  pending: "text-warning bg-warning/15",
  running: "text-primary  bg-primary/15",
};

const stateToIcon: Record<MetaGenomicState["state"], ReactNode> = {
  canceled: <Ban />,
  completed: <CircleCheck />,
  failed: <CircleX />,
  pending: <CircleEllipsis />,
  running: <CirclePlay />,
};

export function MetaList() {
  const { data, isLoading, isError } = useQuery<MetaGenomicState[]>({
    queryKey: ["list-meta-genomics"],
    refetchInterval: 2000,
    queryFn: async () => {
      const { data } = await api.get<MetaGenomicState[]>("/v1/metagenomics");
      return data;
    },
  });

  if (isLoading) return <LoadingFull />;
  if (isError) return <ErrorFull />;
  if (!data) return "No data";

  return (
    <ScrollShadow
      hideScrollBar
      className="flex flex-col items-center justify-center @container overflow-y-auto h-full"
    >
      <Accordion
        variant="splitted"
        defaultExpandedKeys={[data[0].id]}
        className="w-full h-full"
      >
        {data?.map(({ parameters: meta, id, iteration, state }) => (
          <AccordionItem
            key={id}
            textValue={meta.runName}
            onPress={() => setFocusedMeta(meta)}
            startContent={
              <IconWrapper className={iconColors[state]}>
                {stateToIcon[state]}
              </IconWrapper>
            }
            title={<p>{meta.runName}</p>}
            subtitle={<p>Interaction {iteration}</p>}
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
