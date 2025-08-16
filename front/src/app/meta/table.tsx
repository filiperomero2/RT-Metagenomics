"use client";

import { IconState } from "@/components/icon/state-icon";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import { api } from "@/lib/axios";
import { MetaGenomicRun } from "@/types/meta-genomic-run";
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
  const focused = useFocusedRun();
  const [shouldRefetch, setShouldRefetch] = useState(true);

  const { data, isPending, isError } = useQuery<MetaGenomicRun[]>({
    queryKey: queryKeys.getAllMetaGenomics(),
    refetchInterval: shouldRefetch ? 2000 : 0,
    queryFn: async () => {
      const { data } = await api.get<MetaGenomicRun[]>("/v1/metagenomics");
      setShouldRefetch(data.some((item) => loadingStates.includes(item.state)));
      return data;
    },
  });

  if (isError) return <ErrorFull />;

  const reversedData = data ? [...data].toReversed() : [];

  return (
    <Table
      aria-label="Metagenomics Table"
      removeWrapper
      defaultSelectedKeys={[focused?.id || ""]}
      selectionMode="single"
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
      <TableBody
        emptyContent={"No rows to display."}
        isLoading={isPending}
        loadingContent={<LoadingFull className="mt-[3.5rem]" />}
      >
        {reversedData.map((run) => (
          <TableRow
            key={run.id}
            className="cursor-pointer rounded-xl"
            onClick={() => setFocusedRun(run)}
          >
            <TableCell>
              <IconState state={run.state} />
            </TableCell>
            <TableCell>{run.parameters.dataType}</TableCell>
            <TableCell className="w-full">{run.name}</TableCell>
            <TableCell>{run.iteration}</TableCell>
            <TableCell>1</TableCell>
            <TableCell>2</TableCell>
            <TableCell className="flex justify-center">
              <Button size="sm" isIconOnly variant="flat">
                <Trash2 size={20} className="text-danger" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
