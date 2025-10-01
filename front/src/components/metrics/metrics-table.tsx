import {
  Divider,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Accordion } from "../custom-accordion";
import { Fragment, useEffect, useState } from "react";
import { MetricsTableProps } from "./types";
import { useFocusedRun } from "@/hooks/use-focused-run";
import { ChevronRightIcon } from "lucide-react";

export function MetricsTable({
  sampleMetrics,
  summaryMetrics,
}: MetricsTableProps) {
  const focused = useFocusedRun();
  const [show, setShow] = useState(!!sampleMetrics);

  useEffect(() => {
    setShow(!!sampleMetrics);
  }, [sampleMetrics]);

  return (
    <Accordion title="Metrics" show={show} toggle={() => setShow(!show)}>
      {sampleMetrics && (
        <div className="grid grid-cols-2 gap-1 p-1">
          {focused?.samples.map((sample) => {
            const metrics = sampleMetrics[sample.name];
            return (
              <div
                key={sample.id}
                className="border-content3 flex flex-col overflow-clip border rounded-xl"
              >
                <p className="bg-content3 py-1 text-center uppercase">
                  {sample.name}
                </p>
                <div className="flex flex-col gap-2 p-2">
                  <Progress
                    showValueLabel
                    size="lg"
                    label={`Identified Sequences: ${metrics.nIdentifiedSequences} of ${metrics.nSequences}`}
                    value={metrics.nIdentifiedSequences}
                    maxValue={metrics.nSequences}
                  />
                  {/* <p className="text-center">pathologies</p> */}
                  <div className="mx-1 my-5 flex flex-col gap-1">
                    {metrics.pathologies.map((pathology, index) => (
                      <div
                        key={pathology.name}
                        className="bg-content3/30 overflow-clip rounded-md pl-2"
                      >
                        {/* {index > 0 && <Divider className="ml-auto" />} */}
                        <div className="grid grid-cols-[1fr_auto_3fr] items-center justify-center gap-4">
                          <div className="py-1">
                            <p>name: {pathology.name}</p>
                            <Progress
                              showValueLabel
                              size="sm"
                              label={`Reads: ${pathology.nReads} of ${metrics.nSequences}`}
                              value={pathology.nReads}
                              maxValue={metrics.nSequences}
                            />
                          </div>
                          <ChevronRightIcon className="text-primary" size={32}/>
                          <div className="flex flex-col gap-1">
                            {pathology.pathogens.map((pathogen) => (
                              <div
                                key={pathogen.pathogen}
                                className="bg-content3/60 flex flex-col gap-1 rounded"
                              >
                                <p className="px-2 pt-1">{pathogen.pathogen}</p>
                                <Progress
                                  size="sm"
                                  value={pathogen.nReads}
                                  maxValue={metrics.nSequences}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Accordion>
  );
}
