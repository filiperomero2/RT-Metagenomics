"use client";
import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { api } from "@/lib/axios";
import { MetaGenomic } from "@/types/meta-genomic";
import { Button, Divider, SelectItem } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  runName: z.string().min(5, { message: "Run Name is required" }),
  dataType: z.enum(["illumina", "nanopore"]),
  threads: z.number().min(1, { message: "Threads must be at least 1" }),
  threadsTotal: z
    .number()
    .min(1, { message: "Threads Total must be at least 1" }),
  trim: z.number().min(0, { message: "Trim must be at least 0" }),
  removeHumanReads: z.boolean(),
  removeUnclassifiedReads: z.boolean(),
  minimumReadLength: z
    .number()
    .min(1, { message: "Minimum Read Length must be at least 1" }),
  outputDir: z.string().min(1, { message: "Output Directory is required" }),
  sampleSheetFilePath: z
    .string()
    .min(1, { message: "Sample Sheet Path is required" }),
  kraken2DatabasePath: z
    .string()
    .min(1, { message: "Kraken2 Database Path is required" }),
  kronaDatabasePath: z
    .string()
    .min(1, { message: "Krona Database Path is required" }),
  adaptersPath: z.string().min(1, { message: "Adapters Path is required" }),
});

export function MetaForm() {
  const [storedForm, setStoredForm] = useLocalStorage<MetaGenomic | undefined>(
    "meta-genomic-form",
    undefined,
    { initializeWithValue: false }
  );

  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: MetaGenomic) => {
      await api.post("/v1/metagenomics", data);
      queryClient.invalidateQueries({ queryKey: ["list-meta-genomics"] });
    },
  });

  const form = useForm<MetaGenomic>({
    values: {
      runName: "",
      dataType: storedForm?.dataType ?? "illumina",
      threads: 1,
      threadsTotal: 1,
      trim: 0,
      removeHumanReads: false,
      removeUnclassifiedReads: false,
      minimumReadLength: 50,
      outputDir: storedForm?.outputDir ?? "",
      sampleSheetFilePath: storedForm?.sampleSheetFilePath ?? "",
      kraken2DatabasePath: storedForm?.kraken2DatabasePath ?? "",
      kronaDatabasePath: storedForm?.kronaDatabasePath ?? "",
      adaptersPath: storedForm?.adaptersPath ?? "",
    },
    resolver: zodResolver(schema as any),
  });

  const handleSubmit = (data: MetaGenomic) => {
    form.reset();
    setStoredForm(data);
    mutateAsync(data);
  };

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid grid-cols-2 gap-x-3 gap-y-1 w-full relative h-full content-start @container"
      >
        <Input name="runName" type="text" label="Run Name" />
        <Select name="dataType" label="Data Type">
          <SelectItem key="illumina">Illumina</SelectItem>
          <SelectItem key="nanopore">Nanopore</SelectItem>
        </Select>
        <NumberInput
          name="threads"
          label="Threads"
          className="@md:col-span-1 col-span-2"
        />
        <NumberInput
          name="threadsTotal"
          label="Threads Total"
          className="@md:col-span-1 col-span-2"
        />
        <NumberInput
          name="trim"
          label="Trim"
          className="@md:col-span-1 col-span-2"
        />
        <NumberInput
          name="minimumReadLength"
          label="Minimum Read Length"
          className="@md:col-span-1 col-span-2"
        />

        <CheckBox
          name="removeUnclassifiedReads"
          label="Remove Unclassified Reads"
        />
        <CheckBox name="removeHumanReads" label="Remove Human Reads" />

        <Divider className="col-span-2 my-3" />

        <Input
          name="outputDir"
          label="Output Directory"
          className="col-span-2"
        />
        <Input
          name="sampleSheetFilePath"
          label="Sample Sheet Path"
          className="col-span-2"
        />
        <Input
          name="kraken2DatabasePath"
          label="Kraken2 Database Path"
          className="col-span-2"
        />
        <Input
          name="kronaDatabasePath"
          label="Krona Database Path"
          className="col-span-2"
        />
        <Input
          name="adaptersPath"
          label="Adapters Path"
          className="col-span-2"
        />
        <div className="col-span-2 mt-5 sticky bottom-0 w-full bg-content1 p-2 z-10 pb-0">
          <Button
            variant="solid"
            color="primary"
            type="submit"
            className="w-full"
            isLoading={isPending}
          >
            Submit
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
