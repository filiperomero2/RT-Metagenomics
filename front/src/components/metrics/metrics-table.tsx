import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { Accordion } from "../custom-accordion";
import { useEffect, useState } from "react";
import { MetricsTableProps } from "./types";

export function MetricsTable({ sampleMetrics }: MetricsTableProps) {
  const [show, setShow] = useState(!!sampleMetrics);

  useEffect(() => {
    setShow(!!sampleMetrics);
  }, [sampleMetrics]);

  return (
    <Accordion title="Metrics" show={show} toggle={() => setShow(!show)}>
      <Table
        key="metrics table"
        removeWrapper
        className="mx-3 my-2"
        aria-label="Example static collection table"
      >
        <TableHeader>
          <TableColumn>SAMPLE</TableColumn>
          <TableColumn>TOTAL READS</TableColumn>
          <TableColumn>CLASSIFIED READS</TableColumn>
          <TableColumn>FAMILY</TableColumn>
          <TableColumn>FAMILY #READS</TableColumn>
          <TableColumn>SPECIES</TableColumn>
          <TableColumn>SPECIES #READS</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow key="1">
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
          </TableRow>
          <TableRow key="2">
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
          </TableRow>
          <TableRow key="3">
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
          </TableRow>
          <TableRow key="4">
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
          </TableRow>
          <TableRow key="5">
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
            <TableCell>123</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Accordion>
  );
}
