"use client";
import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { Button, SelectItem } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { FormProvider, useForm } from "react-hook-form";

export function MetaForm() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: any) => {
      await axios
        .post("/v1/metagenomics", data)
        .then((response) => {
          console.log("Response", response.data);
          // Handle success
        })
        .catch((error) => {
          console.error("Error", error);
          // Handle error
        });
    },
  });
  
  const form = useForm({
    defaultValues: {
      dataType: "",
    },
  });

  const handleSubmit = (data: any) => {
    console.log("data", data);
    mutateAsync(data);
    // Handle form submission logic here
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid grid-cols-2 gap-x-3 gap-y-1 w-full"
      >
        <Input
          name="runName"
          type="text"
          label="Run Name"
          className="col-span-2"
        />
        <Select name="dataType" label="Data Type" className="col-span-2">
          <SelectItem key="">Select</SelectItem>
          <SelectItem key="illumina">Illumina</SelectItem>
          <SelectItem key="nanopore">Nanopore</SelectItem>
        </Select>
        <NumberInput name="threads" label="Threads" />
        <NumberInput name="threadsTotal" label="Threads Total" />
        <NumberInput name="trim" label="Trim" />
        <NumberInput name="minimumReadLength" label="Minimum Read Length" />
        <Input name="sampleSheet" type="file" label="Sample Sheet" />
        <Input name="output" type="file" label="Output Directory" />
        <Input name="kraken2Database" type="file" label="Kraken2 Database" />
        <Input name="kronaDatabase" type="file" label="Krona Database" />
        <Input
          name="adapters"
          type="file"
          label="Adapters"
          className="col-span-2"
        />
        <CheckBox name="removeHumanReads" label="Remove Human Reads" />
        <CheckBox
          name="removeUnclassifiedReads"
          label="Remove Unclassified Reads"
        />

        <Button
          className="col-span-2 mt-5"
          variant="solid"
          color="primary"
          type="submit"
          isLoading={isPending}
        >
          Submit
        </Button>
      </form>
    </FormProvider>
  );
}
