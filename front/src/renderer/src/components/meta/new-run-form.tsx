import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { api } from "@/lib/axios";
import { MetaGenomic } from "@/types/meta-genomic";
import {
  Accordion,
  AccordionItem,
  Alert,
  AlertDialog,
  Button,
  ListBox,
  Modal,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

import { queryKeys } from "@/utils/query-keys-factory";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Autocomplete } from "@/components/form/autocomplete";
import {
  META_GENOMIC_FORM_STORAGE_KEY,
} from "@/constants/local-storage";
import { useSettings } from "@/hooks/use-settings";
import {
  getDefaultKraken2DatabasePath,
} from "@/types/settings";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utils/cn";
import { Link } from "@tanstack/react-router";
import { Cog, Database, Dna, Plus, X } from "lucide-react";

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
  taxdump: z.string().min(1, { message: "Taxdump path is required" }),
  diamondDatabase: z
    .string()
    .min(1, { message: "Diamond Database Path is required" }),
  samples: z
    .array(
      z.object({
        name: z
          .string()
          .min(1, "")
          .regex(
            /^[a-zA-Z_-]+$/,
            "Only letters, underscores, and hyphens are allowed",
          ),
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
  const [storedForm, setStoredForm] = useLocalStorage<
    z.infer<typeof schema> | undefined
  >(META_GENOMIC_FORM_STORAGE_KEY, undefined, { initializeWithValue: false });
  const { data: globalSettings, isLoading: isSettingsLoading } = useSettings();

  const taxdumpDefault =
    (globalSettings?.databases?.taxdump ?? "").trim() ||
    (storedForm?.taxdump ?? "").trim() ||
    "";
  const viralDmndRaw =
    (globalSettings?.databases?.diamond ?? "").trim() ||
    (storedForm?.diamondDatabase ?? "").trim() ||
    "";

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
      path: storedForm?.path ?? "",
      runName: "",
      dataType: storedForm?.dataType ?? "nanopore",
      threads: 1,
      threadsTotal: 1,
      trim: 0,
      removeHumanReads: false,
      removeUnclassifiedReads: false,
      minimumReadLength: 50,
      kraken2Database:
        (
          getDefaultKraken2DatabasePath(globalSettings?.databases?.kraken2) ||
          storedForm?.kraken2Database
        ) ??
        "",
      kronaDatabase:
        globalSettings?.databases?.krona ?? storedForm?.kronaDatabase ?? "",
      taxdump: taxdumpDefault,
      diamondDatabase: viralDmndRaw,
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
  const settingsTaxdump =
    (globalSettings?.databases?.taxdump ?? "").trim() || "";
  const settingsViral =
    (globalSettings?.databases?.diamond ?? "").trim() || "";
  const hasDatabases = Boolean(
    getDefaultKraken2DatabasePath(globalSettings?.databases?.kraken2) &&
      (globalSettings?.databases?.krona ?? "").trim() &&
      settingsTaxdump &&
      settingsViral,
  );

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setStoredForm(data);
    await mutateAsync(data, {
      onSuccess: () => {
        handleClose();
        form.reset();
      },
    });
  };

  const button = (
    <Button onPress={handleOpen} isDisabled={isSettingsLoading}>
      <Plus />
      New Metagenomic
    </Button>
  );

  if (!hasDatabases) {
    return (
      <AlertDialog>
        {button}
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[400px]">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Missing Databases</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>
                  To run a metagenomic analysis, you need to configure the paths
                  for the Kraken2, Krona, and Diamond databases.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close" variant="tertiary">
                  Cancel
                </Button>
                <Button slot="close" variant="primary">
                  <Link to="/settings">Go to Settings</Link>
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    );
  }

  return (
    <>
      <Modal {...modal}>
        {button}
        <Modal.Backdrop variant="blur" isDismissable>
          <FormProvider {...form}>
            <Modal.Container size="cover">
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>New Metagenomics</Modal.Header>
                <Modal.Body className="grid content-start gap-x-3 gap-y-1">
                  <div className="grid grid-cols-4 gap-2 px-3">
                    <Input
                      name="runName"
                      type="text"
                      label="Run Name"
                      placeholder="Name of the run"
                    />
                    <Select name="dataType" label="Data Type">
                      <ListBox.Item id="illumina" textValue="Illumina">
                        Illumina
                        <ListBox.ItemIndicator />
                      </ListBox.Item>

                      <ListBox.Item id="nanopore" textValue="Nanopore">
                        Nanopore
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </Select>
                    <Input
                      name="path"
                      type="text"
                      label="Path"
                      placeholder="/path/to/data"
                      className="col-span-2"
                      isFolderSelector
                    />
                  </div>

                  <div className="nth-[0]:px-3">
                    <Accordion
                      allowsMultipleExpanded
                      defaultExpandedKeys={[ "Samples"]}
                    >
                      <Accordion.Item id="Options">
                        <Accordion.Heading>
                          <Accordion.Trigger>
                            <p className="flex items-center gap-2">Options</p>
                            <Cog />
                          </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                          <Accordion.Body className="@container grid grid-cols-2 gap-2">
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
                          </Accordion.Body>
                        </Accordion.Panel>
                      </Accordion.Item>

                      <Accordion.Item id="Databases">
                        <Accordion.Heading>
                          <Accordion.Trigger>
                            <p className="flex items-center gap-2">Databases</p>
                            <Database />
                          </Accordion.Trigger>
                        </Accordion.Heading>
                        <Accordion.Panel>
                          <Accordion.Body className="grid grid-cols-2 gap-2">
                            <Input
                              name="kraken2Database"
                              label="Kraken2 Database"
                              isDisabled
                            />
                            <Input
                              name="kronaDatabase"
                              label="Krona Database"
                              isDisabled
                            />
                            <Input
                              name="taxdump"
                              label="Diamond taxdump"
                              isDisabled
                            />
                            <Input
                              name="diamondDatabase"
                              label="Diamond Database"
                              isDisabled
                            />
                            <Alert
                              status="accent"
                              className="bg-surface-secondary col-span-2 w-full"
                            >
                              <Alert.Indicator />
                              <Alert.Content>
                                <Alert.Title>Path configuration</Alert.Title>
                                <Alert.Description>
                                  To change database paths, go to the{" "}
                                  <Link
                                    to="/settings"
                                    className="font-bold underline underline-offset-2"
                                  >
                                    Settings
                                  </Link>{" "}
                                  page.
                                </Alert.Description>
                              </Alert.Content>
                            </Alert>
                          </Accordion.Body>
                        </Accordion.Panel>
                      </Accordion.Item>

                      <AccordionItem
                        id="Samples"
                        // textValue="Samples"
                        // indicator={<Dna />}
                      >
                        <Accordion.Heading>
                          <Accordion.Trigger>
                            <p className="flex items-center gap-2">Samples</p>
                            <Dna />
                          </Accordion.Trigger>
                        </Accordion.Heading>

                        <Accordion.Panel>
                          <Accordion.Body>
                            <div className="grid gap-2 pb-2">
                              {samplesArrayField.fields.map((field, index) => (
                                <Sample
                                  key={field.id}
                                  index={index}
                                  canDelete={
                                    samplesArrayField.fields.length > 1
                                  }
                                  deleteSample={() =>
                                    samplesArrayField.remove(index)
                                  }
                                />
                              ))}
                            </div>
                            <Button
                              className="mt-2 w-full"
                              variant="primary"
                              type="button"
                              onPress={() =>
                                samplesArrayField.append(
                                  { name: "", barcode: "" },
                                  {
                                    focusIndex: samplesArrayField.fields.length,
                                  },
                                )
                              }
                            >
                              <Plus />
                            </Button>
                          </Accordion.Body>
                        </Accordion.Panel>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </Modal.Body>
                <Modal.Footer>
                  <Button
                    variant="danger-soft"
                    type="button"
                    size="lg"
                    onPress={handleClose}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    className="px-10"
                    isPending={isPending}
                    onClick={form.handleSubmit(handleSubmit, console.log)}
                  >
                    Submit
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </FormProvider>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}

function Sample({
  index,
  canDelete,
  deleteSample,
}: {
  index: number;
  canDelete: boolean;
  deleteSample: () => void;
}) {
  const isNegative = useWatch({ name: `samples.${index}.isNegativeControl` });
  const color = "default";

  return (
    <div
      className={cn(
        "grid w-full grid-cols-[2fr_1fr_auto] items-end gap-2",
        isNegative && "ring-danger-soft/60 bg-danger-soft/15 rounded-lg ring",
      )}
    >
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
      />
      <Autocomplete
        name={`samples.${index}.barcode`}
        label="Barcode"
        className="flex-1/4"
      >
        {barcodes.map((item) => (
          <ListBox.Item id={item.key} textValue={item.label}>
            {item.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        ))}
      </Autocomplete>

      {canDelete && (
        <Button
          variant="danger-soft"
          isIconOnly
          size="md"
          aria-label="Remove Sample"
          type="button"
          onPress={deleteSample}
        >
          <X />
        </Button>
      )}
    </div>
  );
}
