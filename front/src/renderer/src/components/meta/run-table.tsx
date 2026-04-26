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
  Separator,
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

  const reversedData = data ? [...data].toReversed() : [];

  return (
    <Table aria-label="Metagenomics Table">
      <Table.ScrollContainer>
        <Table.Content
          selectionMode="single"
          onSelectionChange={(selection) => {
            if (typeof selection === "string") return;
            const run = reversedData.find((run) => selection?.has(run.id));

            setFocusedRun(run);
          }}
        >
          <Table.Header>
            <Table.Column width="2.5%" isRowHeader>
              Status
            </Table.Column>
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
                {isPending ? (
                  <LoadingFull className="mt-4" />
                ) : (
                  <>
                    <Icon
                      className="text-muted size-6"
                      icon="gravity-ui:tray"
                    />
                    <span className="text-muted text-sm">No results found</span>
                  </>
                )}
              </EmptyState>
            )}
          >
            {reversedData.map((run) => (
              <Table.Row
                key={run.id}
                id={run.id}
                className="cursor-pointer rounded-xl"
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
                      <Popover.Dialog className="flex w-lg flex-col">
                        <Popover.Heading className="pb-3 text-xl font-bold">
                          PARAMETERS
                        </Popover.Heading>
                        <Separator className="mb-2" />
                        <div className="flex w-full flex-col gap-0.5 rounded-xl">
                          <ParameterItem
                            label="Last change:"
                            value={new Date(
                              run.executionHashTime,
                            )?.toLocaleString()}
                          />
                          {Object.entries(run.parameters).map(
                            ([key, value]) => (
                              <ParameterItem
                                key={key}
                                label={key}
                                value={value}
                              />
                            ),
                          )}
                        </div>
                      </Popover.Dialog>
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
    <div className="flex w-full justify-between gap-2">
      <p className="text-foreground/95 font-semibold capitalize">{label}</p>

      <Tooltip delay={1000}>
        <Tooltip.Trigger className="text-foreground/80 line-clamp-1 w-1/2 text-end">
          {String(value)}
        </Tooltip.Trigger>
        <Tooltip.Content className="text-foreground-400">
          {String(value)}
        </Tooltip.Content>
      </Tooltip>
    </div>
  );
}
