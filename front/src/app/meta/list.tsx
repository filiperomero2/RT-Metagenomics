import { cn } from "@/utils/cn";
import {
  Accordion,
  AccordionItem,
  Checkbox,
  Divider,
  Spinner,
} from "@heroui/react";
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
  const currentMetas = [
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

  return (
    <div className="flex flex-col items-center justify-center gap-1 @container">
      <Accordion variant="splitted">
        {currentMetas.map((meta) => (
          <AccordionItem
            key={meta.id}
            aria-label={meta.runName}
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
        ))}
      </Accordion>
    </div>
  );
}
