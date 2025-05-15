"use client";

import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { Button, SelectItem } from "@heroui/react";
import axios from "axios";
import { FormProvider, useForm } from "react-hook-form";

export default function Meta() {
  const form = useForm();

  const handleSubmit = (data: any) => {
    console.log("data", data);

    axios
      .post("/v1/metagenomics", data)
      .then((response) => {
        console.log("Response:", response.data);
        // Handle success
      })
      .catch((error) => {
        console.error("Error:", error);
        // Handle error
      });
    // Handle form submission logic here
  };

  return (
    <FormProvider {...form}>
      <div className="grid grid-cols-[1fr_1.5fr] gap-2 p-4 items-center h-screen">
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-3xl font-bold">Metagenomics</h1>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid grid-cols-2 gap-x-3 gap-y-1"
          >
            <Input
              name="runName"
              type="text"
              label="Run Name:"
              className="col-span-2"
            />
            <Select name="dataType" label="Data Type:" className="col-span-2">
              <SelectItem key="">Select</SelectItem>
              <SelectItem key="illumina">Illumina</SelectItem>
              <SelectItem key="nanopore">Nanopore</SelectItem>
            </Select>
            <Input name="sampleSheet" type="file" label="Sample Sheet:" />
            <Input name="output" type="file" label="Output Directory:" />
            <NumberInput name="threads" label="Threads:" />
            <NumberInput name="threadsTotal" label="Threads Total:" />
            <NumberInput name="trim" label="Trim:" />
            <NumberInput
              name="minimumReadLength"
              label="Minimum Read Length:"
            />
            <Input
              name="kraken2Database"
              type="file"
              label="Kraken2 Database:"
            />
            <Input name="kronaDatabase" type="file" label="Krona Database:" />
            <CheckBox name="removeHumanReads" label="Remove Human Reads:" />
            <CheckBox
              name="removeUnclassifiedReads"
              label="Remove Unclassified Reads:"
            />
            <Input name="adapters" type="file" label="Adapters:" />
            <Button
              className="col-span-2"
              variant="solid"
              color="primary"
              type="submit"
            >
              Submit
            </Button>
          </form>
        </div>
        <div>{/* Empty column for now */}</div>
      </div>
    </FormProvider>
  );
}
