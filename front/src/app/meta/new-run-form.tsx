"use client";
import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { api } from "@/lib/axios";
import { MetaGenomic } from "@/types/meta-genomic";
import {
  Accordion,
  AccordionItem,
  AutocompleteItem,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  SelectItem,
  Tooltip,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

import { queryKeys } from "@/utils/query-keys-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Autocomplete } from "@/components/form/autocomplete";
import { useModal } from "@/hooks/use-modal";
import { Cog, Database, Dna, Plus, X } from "lucide-react";
import { cn } from "@/utils/cn";

const schema = z.object({
  path: z.string().min(1, { message: "Path is required" }),
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
  kraken2Database: z
    .string()
    .min(1, { message: "Kraken2 Database Path is required" }),
  kronaDatabase: z
    .string()
    .min(1, { message: "Krona Database Path is required" }),
  samples: z
    .array(
      z.object({
        name: z.string().min(1, "").regex(/^[a-zA-Z_-]+$/, "Only letters, underscores, and hyphens are allowed"),
        barcode: z.string().min(1, ""),
        isNegativeControl: z.boolean().default(false),
      }),
    )
    .min(1, { message: "At least one sample is required" }),
});

const barcodes = Array.from({ length: 96 })
  .fill(0)
  .map((_, i) => ({
    key: `barcode${i + 1 < 10 ? "0" + (i + 1) : i + 1}`,
    label: `barcode${i + 1 < 10 ? "0" + (i + 1) : i + 1}`,
  }));

export function NewRunForm() {
  const { modal, handleOpen, handleClose } = useModal();
  const [storedForm, setStoredForm] = useLocalStorage<MetaGenomic | undefined>(
    "meta-genomic-form",
    undefined,
    { initializeWithValue: false },
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: MetaGenomic) => api.post("/v1/metagenomics/run", data),
    meta: {
      invalidatesQuery: queryKeys.getAllMetaGenomics(),
      successMessage: {
        title: "MetaGenomic Run Submission",
        description: "Successfully submitted MetaGenomic run",
      },
      errorMessage: {
        title: "MetaGenomic Run Submission",
        description: "Failed to submit MetaGenomic run",
      },
    },
  });

  const form = useForm({
    values: {
      path: "",
      runName: "",
      dataType: storedForm?.dataType ?? "nanopore",
      threads: 1,
      threadsTotal: 1,
      trim: 0,
      removeHumanReads: false,
      removeUnclassifiedReads: false,
      minimumReadLength: 50,
      kraken2Database: storedForm?.kraken2Database ?? "",
      kronaDatabase: storedForm?.kronaDatabase ?? "",
      samples: Array.from({ length: 3 })
        .fill(0)
        .map((_, i) => ({ name: "", barcode: "", isNegativeControl: false })),
    },
    resolver: zodResolver(schema),
  });

  const samplesArrayField = useFieldArray({
    control: form.control,
    name: "samples",
  });

  const handleSubmit = (data: z.infer<typeof schema>) => {
    form.reset();

    setStoredForm(data);
    mutateAsync(data, { onSuccess: handleClose });
  };

  return (
    <>
      <Button
        onPress={handleOpen}
        color="primary"
        variant="flat"
        startContent={<Plus />}
      >
        New Metagenomic
      </Button>
      <Drawer {...modal} size="4xl">
        <DrawerContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1">
              <DrawerHeader>New Metagenomics</DrawerHeader>
              <DrawerBody className="grid min-h-[85%] w-full grid-cols-3 content-start gap-x-3 gap-y-1">
                <Input
                  name="path"
                  type="text"
                  label="Path"
                  className="col-span-2"
                />
                <Input
                  name="runName"
                  type="text"
                  label="Run Name"
                  className="col-span-2"
                />
                <Select name="dataType" label="Data Type">
                  <SelectItem key="illumina">Illumina</SelectItem>
                  <SelectItem key="nanopore">Nanopore</SelectItem>
                </Select>

                <div className="col-span-3 nth-[0]:px-3">
                  <Accordion
                    variant="light"
                    selectionMode="multiple"
                    defaultExpandedKeys={["Samples"]}
                  >
                    <AccordionItem
                      key="Options"
                      textValue="Options"
                      indicator={<Cog />}
                      title={<p className="flex items-center gap-2">Options</p>}
                    >
                      <div className="@container grid grid-cols-2 gap-x-2">
                        <NumberInput
                          name="threads"
                          label="Threads"
                          className="col-span-2 @md:col-span-1"
                        />
                        <NumberInput
                          name="threadsTotal"
                          label="Threads Total"
                          className="col-span-2 @md:col-span-1"
                        />
                        <NumberInput
                          name="trim"
                          label="Trim"
                          className="col-span-2 @md:col-span-1"
                        />
                        <NumberInput
                          name="minimumReadLength"
                          label="Minimum Read Length"
                          className="col-span-2 @md:col-span-1"
                        />

                        <CheckBox
                          name="removeUnclassifiedReads"
                          label="Remove Unclassified Reads"
                        />
                        <CheckBox
                          name="removeHumanReads"
                          label="Remove Human Reads"
                        />
                      </div>
                    </AccordionItem>

                    <AccordionItem
                      key="Databases"
                      textValue="Databases"
                      indicator={<Database />}
                      title={
                        <p className="flex items-center gap-2">Databases</p>
                      }
                    >
                      <Input
                        name="kraken2Database"
                        label="Kraken2 Database"
                        className="col-span-2"
                      />
                      <Input
                        name="kronaDatabase"
                        label="Krona Database"
                        className="col-span-2"
                      />
                    </AccordionItem>

                    <AccordionItem
                      key="Samples"
                      textValue="Samples"
                      indicator={<Dna />}
                      title={<p className="flex items-center gap-2">Samples</p>}
                    >
                      <div className="grid gap-2 pb-2">
                        {samplesArrayField.fields.map((field, index) => (
                          <Sample
                            key={field.id}
                            index={index}
                            canDelete={samplesArrayField.fields.length > 1}
                            deleteSample={() => samplesArrayField.remove(index)}
                          />
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        variant="ghost"
                        type="button"
                        onPress={() =>
                          samplesArrayField.append(
                            { name: "", barcode: "" },
                            { focusIndex: samplesArrayField.fields.length },
                          )
                        }
                      >
                        <Plus />
                      </Button>
                    </AccordionItem>
                  </Accordion>
                </div>
              </DrawerBody>
              <DrawerFooter className="bg-content1 sticky bottom-0 z-10 rounded-t-3xl shadow-2xl">
                <Button
                  variant="light"
                  color="danger"
                  type="button"
                  size="lg"
                  onPress={handleClose}
                >
                  Close
                </Button>
                <Button
                  variant="flat"
                  color="primary"
                  type="submit"
                  size="lg"
                  className="px-10"
                  isLoading={isPending}
                >
                  Submit
                </Button>
              </DrawerFooter>
            </form>
          </FormProvider>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function Sample({ index, canDelete, deleteSample }: { index: number; canDelete: boolean; deleteSample: () => void }) {
  const isNegative = useWatch({ name: `samples.${index}.isNegativeControl` });
  const color = "default";

  return <div className={cn("flex items-start justify-center gap-2 p-1", isNegative && "ring ring-secondary/60 rounded-lg bg-secondary/15")}>
    {/* <Tooltip content="Negative Control" showArrow placement="left">
      <div className="h-full">
        <CheckBox
          color="secondary"
          name={`samples.${index}.isNegativeControl`}
          className="mb-0 h-full w-fit px-3"
        />
      </div>
    </Tooltip> */}
    <Input
      color={color}
      name={`samples.${index}.name`}
      label={`Sample ${index + 1}`}
      className="pb-0"
    />
    <Autocomplete
      color={color}
      name={`samples.${index}.barcode`}
      label={`Barcode`}
      className="flex-1/4 pb-0"
      defaultItems={barcodes}
    >
      {(item) => (
        <AutocompleteItem key={item.key}>
          {item.label}
        </AutocompleteItem>
      )}
    </Autocomplete>

    {canDelete && (
      <Button
        color="default"
        variant="solid"
        isIconOnly
        size="lg"
        aria-label="Remove Sample"
        type="button"
        className="flex items-center justify-center rounded-lg bg-default-100"
        onPress={deleteSample}
      >
        <X
          size={20}
          className="text-danger-500"
          type="button"
        />
      </Button>
    )}
  </div>
}
