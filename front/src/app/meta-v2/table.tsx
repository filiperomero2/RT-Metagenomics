"use client";

import { IconWrapper } from "@/components/icon/icon-wrapper";
import { EmptyFull } from "@/components/state-components/empty-full";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedMeta, useFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { MetaGenomicState } from "@/types/meta-genomic-state";
import { queryKeys } from "@/utils/query-keys-factory";
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CircleCheck,
  CircleEllipsis,
  CircleX,
  Trash2,
} from "lucide-react";
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
  canceled: <Ban size={24} />,
  completed: <CircleCheck size={24} />,
  failed: <CircleX size={24} />,
  pending: <CircleEllipsis size={24} />,
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
      removeWrapper
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
        <TableColumn>Data Type</TableColumn>
        <TableColumn>Run Name</TableColumn>
        <TableColumn>Iteractions</TableColumn>
        <TableColumn>
          <Tooltip content="Number of classified sequencies" showArrow>NCS</Tooltip>
        </TableColumn>
        <TableColumn>
          <Tooltip content="Total of sequencies analyzed" showArrow>TSA</Tooltip>
        </TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {data
          ?.toReversed()
          .map(({ parameters: meta, name, id, iteration, state }) => (
            <TableRow key={id} className="cursor-pointer">
              <TableCell>
                <IconWrapper className={iconColors[state]}>
                  {stateToIcon[state]}
                </IconWrapper>
              </TableCell>
              <TableCell>{meta.dataType}</TableCell>
              <TableCell className="w-full">{name}</TableCell>
              <TableCell>{iteration}</TableCell>
              <TableCell>1</TableCell>
              <TableCell>2</TableCell>
              <TableCell className="flex justify-center">
                <Button size="sm" isIconOnly variant="flat" color="danger">
                  <Trash2 size={24} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
