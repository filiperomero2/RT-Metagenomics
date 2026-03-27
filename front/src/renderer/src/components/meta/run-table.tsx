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
  EmptyState,
  Popover,
  Table,
  Tooltip,
} from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, PlayIcon, SquareIcon } from "lucide-react";
import { useState } from "react";
import { Icon } from "@iconify/react";

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
      // removeWrapper
      // defaultSelectedKeys={[focused?.id || ""]}
      // selectionMode="single"
    >
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column width="2.5%">Status</Table.Column>
            <Table.Column>Data Type</Table.Column>
            <Table.Column>Run Name</Table.Column>
            <Table.Column>Iteractions</Table.Column>
            <Table.Column>
              <Tooltip>
                <Tooltip.Trigger>NCS</Tooltip.Trigger>
                <Tooltip.Content>
                  Number of classified sequencies
                </Tooltip.Content>
              </Tooltip>
            </Table.Column>
            <Table.Column>
              <Tooltip>
                <Tooltip.Trigger>TSA</Tooltip.Trigger>
                <Tooltip.Content>Total of sequencies analyzed</Tooltip.Content>
              </Tooltip>
            </Table.Column>
            <Table.Column>Parameters</Table.Column>
            <Table.Column className="text-center">Actions</Table.Column>
          </Table.Header>
          <Table.Body
            renderEmptyState={() => (
              <EmptyState className="flex h-[15rem] w-full flex-col items-center justify-center gap-4 text-center">
                <Icon className="text-muted size-6" icon="gravity-ui:tray" />
                <span className="text-muted text-sm">No results found</span>
              </EmptyState>
            )}
            // emptyContent={"No rows to display."}
            // isLoading={isPending}
            // loadingContent={<LoadingFull className="mt-[3.5rem]" />}
          >
            {reversedData.map((run) => (
              <Table.Row
                key={run.id}
                className="cursor-pointer rounded-xl"
                onClick={() => setFocusedRun(run)}
              >
                <Table.Cell>
                  <IconState state={run.state} />
                </Table.Cell>
                <Table.Cell>{run.parameters.dataType}</Table.Cell>
                <Table.Cell className="w-full">{run.name}</Table.Cell>

                <Table.Cell>{run.iteration}</Table.Cell>
                <Table.Cell>{run.metrics.nTotalIdentifiedReads}</Table.Cell>
                <Table.Cell>{run.metrics.nTotalReads}</Table.Cell>
                <Table.Cell className="text-center">
                  <Popover>
                    <Popover.Trigger>
                      <Button variant="ghost" size="sm" isIconOnly>
                        <Info />
                      </Button>
                    </Popover.Trigger>
                    <Popover.Content>
                      <div className="flex w-lg flex-col gap-2 px-2 py-2">
                        <p className="text-medium m-auto pb-3 font-bold">
                          PARAMETERS
                        </p>
                        <ParameterItem
                          label="Last change:"
                          value={new Date(
                            run.executionHashTime,
                          )?.toLocaleString()}
                        />
                        {Object.entries(run.parameters).map(([key, value]) => (
                          <ParameterItem key={key} label={key} value={value} />
                        ))}
                      </div>
                    </Popover.Content>
                  </Popover>
                </Table.Cell>
                <Table.Cell>
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
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
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
      <Tooltip delay={1000}>
        <Tooltip.Trigger>
          <p className="text-foreground-400 line-clamp-1 w-1/2 text-end">
            {String(value)}
          </p>
        </Tooltip.Trigger>
        <Tooltip.Content>
          <p className="text-foreground-400">{String(value)}</p>
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}
