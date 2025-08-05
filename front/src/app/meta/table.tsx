"use client";

import { IconState } from "@/components/icon/state-icon";
import { EmptyFull } from "@/components/state-components/empty-full";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedMeta, useFocusedMeta } from "@/hooks/use-focused-meta";
import { api } from "@/lib/axios";
import { MetaGenomicState } from "@/types/meta-genomic-state";
import { queryKeys } from "@/utils/query-keys-factory";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";

const loadingStates = ["running", "pending"];

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
          <Tooltip content="Number of classified sequencies" showArrow>
            NCS
          </Tooltip>
        </TableColumn>
        <TableColumn>
          <Tooltip content="Total of sequencies analyzed" showArrow>
            TSA
          </Tooltip>
        </TableColumn>
        <TableColumn>Actions</TableColumn>
      </TableHeader>
      <TableBody>
        {data
          ?.toReversed()
          .map(({ parameters: meta, name, id, iteration, state }) => (
            <TableRow key={id} className="cursor-pointer">
              <TableCell>
                <IconState state={state} />
              </TableCell>
              <TableCell>{meta.dataType}</TableCell>
              <TableCell className="w-full">{name}</TableCell>
              <TableCell>{iteration}</TableCell>
              <TableCell>1</TableCell>
              <TableCell>2</TableCell>
              <TableCell className="flex justify-center">
                <Button size="sm" isIconOnly variant="flat">
                  <Trash2 size={20} className="text-danger"/>
                </Button>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
