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
  Button,
  ModalFooter,
  SelectItem,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

import { queryKeys } from "@/utils/query-keys-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useModal } from "@/hooks/use-modal";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Cog, Database, Dna, Plus, Trash, X } from "lucide-react";

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
  kraken2Database: z
    .string()
    .min(1, { message: "Kraken2 Database Path is required" }),
  kronaDatabase: z
    .string()
    .min(1, { message: "Krona Database Path is required" }),
  samples: z
    .array(
      z.object({
        value: z.string(),
      })
    )
    .min(1, { message: "At least one sample is required" }),
});

export function MetaForm() {
  const { modal, handleOpen, handleClose } = useModal();
  const [storedForm, setStoredForm] = useLocalStorage<MetaGenomic | undefined>(
    "meta-genomic-form",
    undefined,
    { initializeWithValue: false }
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
      samples: [{ value: "" }],
    },
    resolver: zodResolver(schema),
  });

  const samplesArrayField = useFieldArray({
    control: form.control,
    name: "samples",
  });

  const handleSubmit = (data: z.infer<typeof schema>) => {
    form.reset();
    const transformedData: MetaGenomic = {
      ...data,
      samples: data.samples.map((item) => item.value),
    };

    setStoredForm(transformedData);
    mutateAsync(transformedData, { onSuccess: handleClose });
  };

  console.log(samplesArrayField.fields, form.getValues());

  return (
    <>
      <Button onPress={handleOpen} isIconOnly color="primary" variant="shadow">
        <Plus />
      </Button>
      <Modal {...modal} size="5xl">
        <ModalContent>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <ModalHeader>New Metagenomics</ModalHeader>
              <ModalBody className="grid grid-cols-3 gap-x-3 gap-y-1 w-full relative h-full content-start @container">
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
                    variant="splitted"
                    className="p-0"
                    selectionMode="multiple"
                    defaultExpandedKeys={["1"]}
                  >
                    <AccordionItem
                      key="1"
                      textValue="Samples"
                      title={
                        <p className="flex items-center gap-2">
                          <Dna />
                          Samples
                        </p>
                      }
                    >
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-x-2">
                        {samplesArrayField.fields.map((field, index) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-center gap-2"
                          >
                            <Input
                              name={`samples.${index}.value`}
                              label={`Sample ${index + 1}`}
                              className="col-span-2"
                              endContent={
                                samplesArrayField.fields.length > 1 && (
                                  <button className="flex h-full items-center justify-center cursor-pointer transition">
                                    <motion.div
                                      whileHover={{ rotateZ: "90deg" }}
                                      className="hover:bg-danger/20 rounded-2xl p-0.5"
                                    >
                                      <X
                                        size={20}
                                        className="text-danger"
                                        onClick={() =>
                                          samplesArrayField.remove(index)
                                        }
                                      />
                                    </motion.div>
                                  </button>
                                )
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        className="w-full"
                        variant="flat"
                        color="default"
                        onPress={() =>
                          samplesArrayField.append(
                            { value: "" },
                            { focusIndex: samplesArrayField.fields.length }
                          )
                        }
                      >
                        <Plus />
                      </Button>
                    </AccordionItem>

                    <AccordionItem
                      key="2"
                      textValue="Databases"
                      title={
                        <p className="flex items-center gap-2">
                          <Database />
                          Databases
                        </p>
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
                      key="3"
                      textValue="Advanced Options"
                      title={
                        <p className="flex items-center gap-2">
                          <Cog />
                          Advanced Options
                        </p>
                      }
                    >
                      <div className="grid grid-cols-2 gap-x-2 ">
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
                          className="pb-4"
                          name="removeUnclassifiedReads"
                          label="Remove Unclassified Reads"
                        />
                        <CheckBox
                          className="pb-4"
                          name="removeHumanReads"
                          label="Remove Human Reads"
                        />
                      </div>
                    </AccordionItem>
                  </Accordion>
                </div>
              </ModalBody>
              <ModalFooter>
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
              </ModalFooter>
            </form>
          </FormProvider>
        </ModalContent>
      </Modal>
    </>
  );
}
