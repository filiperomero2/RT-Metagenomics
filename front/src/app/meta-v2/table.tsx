"use client";

import { IconWrapper } from "@/components/icon/icon-wrapper";
import { EmptyFull } from "@/components/state-components/empty-full";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedMeta, useFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { MetaGenomicState } from "@/types/meta-genomic-state";
import { cn } from "@/utils/cn";
import { queryKeys } from "@/utils/query-keys-factory";
import {
  Accordion,
  AccordionItem,
  Checkbox,
  Divider,
  ScrollShadow,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Ban, CircleCheck, CircleEllipsis, CircleX } from "lucide-react";
import { ReactNode, useState } from "react";

const loadingStates = ["running", "pending"];

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
  running: <Spinner variant="gradient" size="sm" />,
};

export function MetaTable() {
  const focused = useFocusedMeta();
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const { data, isPending, isError } = useQuery<MetaGenomicState[]>({
    queryKey: queryKeys.getAllMetaGenomics(),
    refetchInterval: shouldRefetch ? 2000 : 0,
    queryFn: async () => {
      const { data } = await api.get<MetaGenomicState[]>("/v1/metagenomics");
      setShouldRefetch(data.some((item) => loadingStates.includes(item.state)));
      return data;
    },
  });

  if (isPending) return <LoadingFull />;
  if (isError) return <ErrorFull />;
  if (!data || data.length === 0) return <EmptyFull />;

  return (
    <Table
      aria-label="Metagenomics Table"
      selectionMode="single"
      selectedKeys={[String(focused?.id)]}
      onSelectionChange={(key) => {
        const selected = data.find(
          (item) =>
            item.id === Number((key as Set<string>).values().next().value)
        );

        if (selected) {
          setFocusedMeta(selected);
        }
      }}
    >
      <TableHeader>
        <TableColumn width="2.5%">Status</TableColumn>
        <TableColumn>Run Name</TableColumn>
        <TableColumn>Data Type</TableColumn>
        <TableColumn>Iteractions</TableColumn>
        {/* <TableColumn>Threads</TableColumn>
        <TableColumn>Threads Total</TableColumn>
        <TableColumn>Minimum Read Length</TableColumn>
        <TableColumn>Trim</TableColumn>
        <TableColumn>Remove Human Reads</TableColumn>
        <TableColumn>Remove Unclassified Reads</TableColumn> */}
      </TableHeader>
      <TableBody>
        {data
          ?.toReversed()
          .map(({ parameters: meta, id, iteration, state }) => (
            <TableRow key={id}>
              <TableCell>
                <IconWrapper className={iconColors[state]}>
                  {stateToIcon[state]}
                </IconWrapper>
              </TableCell>
              <TableCell>{meta.runName}</TableCell>
              <TableCell>{meta.dataType}</TableCell>
              <TableCell>{iteration}</TableCell>
              {/* <TableCell>{meta.threads}</TableCell>
              <TableCell>{meta.threadsTotal}</TableCell>
              <TableCell>{meta.minimumReadLength}</TableCell>
              <TableCell>{meta.trim}</TableCell>
              <TableCell>
                <Checkbox
                  className="-mr-5"
                  isReadOnly
                  color="default"
                  defaultSelected={meta.removeHumanReads}
                />
              </TableCell>
              <TableCell>
                <Checkbox
                  className="-mr-5"
                  isReadOnly
                  color="default"
                  defaultSelected={meta.removeUnclassifiedReads}
                />
              </TableCell> */}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
