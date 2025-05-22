"use client";
import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { api } from "@/lib/axios";
import { Button, Divider, SelectItem } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";

export function MetaForm() {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (data: any) => {
      await api.post("/v1/metagenomics", data);
      queryClient.invalidateQueries({ queryKey: ["list-meta-genomics"] });
    },
  });

  const form = useForm({
    defaultValues: {
      runName: "testeapi",
      dataType: "illumina",
      threads: 1,
      threadsTotal: 1,
      trim: 0,
      removeHumanReads: true,
      removeUnclassifiedReads: true,
      minimumReadLength: 50,

      outputDir: "/home/hiagomm/RT-Metagenomics/back/output/testeapi",
      sampleSheetFilePath:
        "/home/hiagomm/RT-Metagenomics/back/input/viralunity_samplesheet.csv",
      kraken2DatabasePath: "/home/hiagomm/RT-Metagenomics/back/input/kraken2",
      kronaDatabasePath:
        "/home/hiagomm/miniconda3/envs/viralunity/opt/krona/taxonomy",
      adaptersPath:
        "/home/hiagomm/RT-Metagenomics/back/input/references/SARS-CoV-2_RefSeq.fasta",
    },
  });

  const handleSubmit = (data: any) => {
    console.log("data", data);
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
