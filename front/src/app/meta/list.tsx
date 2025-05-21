"use client";

import { setFocusedMeta } from "@/hooks/use-focused-meta";
import { MetaGenomic } from "@/types/metagenomic";
import { cn } from "@/utils/cn";
import {
  Accordion,
  AccordionItem,
  Checkbox,
  Divider,
  Spinner,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare2 } from "lucide-react";
import { ReactNode } from "react";

function Item({
  value,
  label,
  span,
}: {
  label: ReactNode;
  value: ReactNode;
  span?: boolean;
}) {
  return (
    <div className={cn("flex justify-between px-2", span && "@md:col-span-2")}>
      <span className="font-bold text-sm text-primary-600 line-clamp-1">
        {label}:
      </span>
      <span>{value}</span>
    </div>
  );
}

export function MetaList() {
  const { data, isPending } = useQuery<MetaGenomic[]>({
    queryKey: ["metas"],
    queryFn: async () => {
      const metas = [
        {
          id: 1,
          runName: "Runn 1",
          dataType: "illumina",
          minimumReadLength: "3",
          removeHumanReads: true,
          removeUnclassifiedReads: true,
          threads: "2",
          threadsTotal: "6",
          trim: "1",
        },
        {
          id: 2,
          runName: "Runn 2",
          dataType: "nanopore",
          minimumReadLength: "5",
          removeHumanReads: false,
          removeUnclassifiedReads: true,
          threads: "4",
          threadsTotal: "8",
          trim: "2",
          done: true,
        },
      ];
      setFocusedMeta(metas[0]);
      return metas;
    },
  });

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" variant="simple" />
      </div>
    );
  }
  if (!data) return null

  return (
    <div className="flex flex-col items-center justify-center gap-1 @container">
      <Accordion variant="splitted" defaultExpandedKeys={[data[0].id]}>
        {data?.map((meta) => (
          <AccordionItem
            key={meta.id}
            aria-label={meta.runName}
            onPress={() => setFocusedMeta(meta)}
            startContent={
              <div className="flex items-center justify-center">
                {meta.done ? (
                  <CheckSquare2 className="text-success text-medium" />
                ) : (
                  <Spinner size="sm" variant="simple" />
                )}
              </div>
            }
            title={<p>{meta.runName}</p>}
            subtitle={<p>Interaction 1</p>}
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
    </div>
  );
}
