

import { IconState } from "@/components/icon/state-icon";
import { ErrorFull } from "@/components/state-components/error-full";
import { LoadingFull } from "@/components/state-components/loading-full";
import { setFocusedRun, useFocusedRun } from "@/hooks/use-focused-run";
import { api } from "@/lib/axios";
import { MetaGenomicRun } from "@/types/meta-genomic-run";
import { queryKeys } from "@/utils/query-keys-factory";
import {
  Button,
  ButtonGroup,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, PlayIcon, SquareIcon } from "lucide-react";
import { useState } from "react";

const loadingStates = ["running", "pending"];

export function RunTable() {
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

  const { mutate: startMetagenomics } = useMutation({
    mutationFn: async (runId: number) => {
      await api.post(`/v1/metagenomics/${runId}/start`);
    },
  });

  const { mutate: stopMetagenomics } = useMutation({
    mutationFn: async (runId: number) => {
      await api.post(`/v1/metagenomics/${runId}/stop`);
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
        <TableColumn>Parameters</TableColumn>
        <TableColumn className="text-center">Actions</TableColumn>
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
            <TableCell>{run.metrics.nTotalIdentifiedReads}</TableCell>
            <TableCell>{run.metrics.nTotalReads}</TableCell>
            <TableCell className="text-center">
              <Popover placement="left" showArrow={true} color="default">
                <PopoverTrigger>
                  <Button variant="light" size="sm" isIconOnly>
                    <Info />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="flex w-lg flex-col gap-2 px-2 py-2">
                    <p className="text-medium m-auto pb-3 font-bold">
                      PARAMETERS
                    </p>
                    <ParameterItem
                      label="Last change:"
                      value={new Date(run.executionHashTime)?.toLocaleString()}
                    />
                    {Object.entries(run.parameters).map(([key, value]) => (
                      <ParameterItem key={key} label={key} value={value} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </TableCell>
            <TableCell>
              <ButtonGroup variant="ghost">
                <Button
                  size="sm"
                  isIconOnly
                  onPress={() => stopMetagenomics(run.id)}
                >
                  <SquareIcon size={18} />
                </Button>
                <Button
                  size="sm"
                  isIconOnly
                  onPress={() => startMetagenomics(run.id)}
                >
                  <PlayIcon size={18} />
                </Button>
              </ButtonGroup>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ParameterItem({
  label,
  value,
}: {
  label: string;
  value: string | number | boolean | undefined;
}) {
  return (
    <div className="flex justify-between gap-2">
      <p className="font-semibold capitalize">{label}</p>
      <Tooltip delay={1000} content={String(value)} placement="bottom-end">
        <p className="text-foreground-400 line-clamp-1 w-1/2 text-end">
          {String(value)}
        </p>
      </Tooltip>
    </div>
  );
}
