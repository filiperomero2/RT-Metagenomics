import { CheckBox } from "@/components/form/checkbox";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { Select } from "@/components/form/select";
import { api } from "@/lib/axios";
import { MetaGenomic } from "@/types/meta-genomic";
import {
  Accordion,
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
import { META_GENOMIC_FORM_STORAGE_KEY } from "@/constants/local-storage";
import { useSettings } from "@/hooks/use-settings";
import { getDefaultKraken2DatabasePath } from "@/types/settings";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/utils/cn";
import { Link } from "@tanstack/react-router";
import { Cog, Database, Dna, Plus, X } from "lucide-react";

const schema = z
  .object({
    path: z.string().min(1, { message: "Path is required" }),
    runName: z.string().min(5, { message: "Run Name is required" }),
    dataType: z.enum(["illumina", "nanopore"]),
    threads: z.number().min(1, { message: "Threads must be at least 1" }),
    threadsTotal: z
      .number()
      .min(1, { message: "Threads Total must be at least 1" }),
    trimHead: z.number().min(0),
    trimTail: z.number().min(0),
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
    taxdump: z.string().optional(),
    taxids: z.string().optional(),
    diamondDatabase: z.string().optional(),
    runDenovoAssembly: z.boolean(),
    runKraken2Reads: z.boolean(),
    runKraken2Contigs: z.boolean(),
    runDiamondReads: z.boolean(),
    runDiamondContigs: z.boolean(),
    hostReference: z.string().optional(),
    deaconIndex: z.string().optional(),
    bleedFraction: z.number().min(0).max(1),
    negativePThreshold: z.number().min(0).max(1),
    minimumHitGroup: z.number().min(1),
    runPolishRacon: z.boolean(),
    runPolishMedaka: z.boolean(),
    medakaModel: z.string().optional(),
    runReferenceAssembly: z.boolean(),
    referenceAssemblyMethod: z.string().optional(),
    referenceAssemblySource: z.string().optional(),
    viralGenomes: z.string().optional(),
    viralTaxids: z.string().optional(),
    adapters: z.string().optional(),
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
  })
  .superRefine((data, ctx) => {
    if (!data.runDenovoAssembly && data.runKraken2Contigs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Kraken2 on contigs needs de novo assembly (MEGAHIT). Enable assembly or turn off Kraken2 on contigs.",
        path: ["runKraken2Contigs"],
      });
    }
    if (!data.runDenovoAssembly && data.runDiamondContigs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Diamond on contigs needs de novo assembly. Enable assembly or turn off Diamond on contigs.",
        path: ["runDiamondContigs"],
      });
    }
    const anyDiamond = data.runDiamondReads || data.runDiamondContigs;
    if (anyDiamond) {
      if (!data.diamondDatabase?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Diamond database path is required when Diamond is enabled",
          path: ["diamondDatabase"],
        });
      }
      if (!data.taxids?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "taxids (protein2taxid.tsv) is required when Diamond is enabled",
          path: ["taxids"],
        });
      }
    }
    if (data.runReferenceAssembly) {
      if (!data.referenceAssemblyMethod?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Method is required for reference assembly",
          path: ["referenceAssemblyMethod"],
        });
      }
      if (!data.referenceAssemblySource?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Source is required for reference assembly",
          path: ["referenceAssemblySource"],
        });
      }
    }
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
      trimHead: storedForm?.trimHead ?? 0,
      trimTail: storedForm?.trimTail ?? 0,
      removeHumanReads: false,
      removeUnclassifiedReads: false,
      minimumReadLength: 50,
      kraken2Database:
        getDefaultKraken2DatabasePath(globalSettings?.databases?.kraken2) ||
        storedForm?.kraken2Database ||
        "",
      kronaDatabase:
        globalSettings?.databases?.krona ?? storedForm?.kronaDatabase ?? "",
      taxdump:
        globalSettings?.databases?.diamond?.taxdump ??
        storedForm?.taxdump ??
        "",
      taxids:
        globalSettings?.databases?.diamond?.taxids ?? storedForm?.taxids ?? "",
      diamondDatabase: storedForm?.diamondDatabase ?? "",
      runDenovoAssembly: storedForm?.runDenovoAssembly ?? false,
      runKraken2Reads: storedForm?.runKraken2Reads ?? true,
      runKraken2Contigs: storedForm?.runKraken2Contigs ?? false,
      runDiamondReads: storedForm?.runDiamondReads ?? false,
      runDiamondContigs: storedForm?.runDiamondContigs ?? false,
      hostReference: storedForm?.hostReference ?? "",
      deaconIndex: storedForm?.deaconIndex ?? "",
      bleedFraction: storedForm?.bleedFraction ?? 0.005,
      negativePThreshold: storedForm?.negativePThreshold ?? 0.01,
      minimumHitGroup: storedForm?.minimumHitGroup ?? 4,
      runPolishRacon: storedForm?.runPolishRacon ?? false,
      runPolishMedaka: storedForm?.runPolishMedaka ?? false,
      medakaModel: storedForm?.medakaModel ?? "",
      runReferenceAssembly: storedForm?.runReferenceAssembly ?? false,
      referenceAssemblyMethod: storedForm?.referenceAssemblyMethod ?? "",
      referenceAssemblySource: storedForm?.referenceAssemblySource ?? "",
      viralGenomes: storedForm?.viralGenomes ?? "",
      viralTaxids: storedForm?.viralTaxids ?? "",
      adapters: storedForm?.adapters ?? "",
      samples: Array.from({ length: 3 })
        .fill(0)
        .map(() => ({
          name: "",
          barcode: "",
          isNegativeControl: false,
        })),
    },
    resolver: zodResolver(schema),
  });

  const samplesArrayField = useFieldArray({
    control: form.control,
    name: "samples",
  });
  const hasDatabases =
    Boolean(
      getDefaultKraken2DatabasePath(globalSettings?.databases?.kraken2),
    ) &&
    Boolean(globalSettings?.databases?.krona) &&
    Boolean(globalSettings?.databases?.diamond?.taxdump);

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setStoredForm(data);
    await mutateAsync(data as MetaGenomic, {
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
                  To run a metagenomic analysis, configure Kraken2, Krona, and
                  NCBI taxdump paths under Settings (taxdump is required for
                  taxonomic summaries).
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
                      defaultExpandedKeys={["Samples"]}
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
                              name="trimHead"
                              label="Trim head (Illumina, bases 5')"
                              className="col-span-2 @md:col-span-1"
                            />
                            <NumberInput
                              name="trimTail"
                              label="Trim tail (Illumina, bases 3')"
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

                            <p className="text-muted col-span-2 text-sm font-medium">
                              Pipeline toggles
                            </p>
                            <CheckBox
                              name="runDenovoAssembly"
                              label="De novo assembly (MEGAHIT)"
                            />
                            <CheckBox
                              name="runKraken2Reads"
                              label="Kraken2 on reads"
                            />
                            <CheckBox
                              name="runKraken2Contigs"
                              label="Kraken2 on contigs"
                            />
                            <CheckBox
                              name="runDiamondReads"
                              label="Diamond on reads"
                            />
                            <CheckBox
                              name="runDiamondContigs"
                              label="Diamond on contigs"
                            />
                            <CheckBox
                              name="runPolishRacon"
                              label="Racon polish (nanopore)"
                            />
                            <CheckBox
                              name="runPolishMedaka"
                              label="Medaka polish (nanopore)"
                            />
                            <CheckBox
                              name="runReferenceAssembly"
                              label="Reference assembly (experimental)"
                            />
                            <NumberInput
                              name="bleedFraction"
                              label="Bleed fraction"
                              className="col-span-2 @md:col-span-1"
                            />
                            <NumberInput
                              name="negativePThreshold"
                              label="Negative control p-threshold"
                              className="col-span-2 @md:col-span-1"
                            />
                            <NumberInput
                              name="minimumHitGroup"
                              label="Kraken2 minimum hit group"
                              className="col-span-2 @md:col-span-1"
                            />
                            <Input
                              name="hostReference"
                              label="Host reference FASTA (optional)"
                              className="col-span-2"
                            />
                            <Input
                              name="deaconIndex"
                              label="Deacon index (optional)"
                              className="col-span-2"
                            />
                            <Input
                              name="medakaModel"
                              label="Medaka model (optional)"
                              className="col-span-2"
                            />
                            <Input
                              name="referenceAssemblyMethod"
                              label="Ref. assembly method (kraken2|diamond|both)"
                              className="col-span-2"
                            />
                            <Input
                              name="referenceAssemblySource"
                              label="Ref. assembly source (reads|contigs|both)"
                              className="col-span-2"
                            />
                            <Input
                              name="viralGenomes"
                              label="Viral genomes FASTA (ref. assembly)"
                              className="col-span-2"
                            />
                            <Input
                              name="viralTaxids"
                              label="Viral genome2taxid TSV (ref. assembly)"
                              className="col-span-2"
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
                          <Accordion.Body className="grid grid-cols-3 gap-2">
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
                              label="Taxdump (NCBI)"
                              isDisabled
                            />
                            <Input
                              name="taxids"
                              label="Diamond taxids (protein2taxid.tsv)"
                              isDisabled
                            />
                            <Input
                              name="diamondDatabase"
                              label="Diamond protein DB (.faa or .dmnd)"
                              placeholder="Required if Diamond reads/contigs enabled"
                              className="col-span-3"
                            />
                            <Alert
                              status="accent"
                              className="bg-surface-secondary col-span-3 w-full"
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

                      <Accordion.Item id="Samples">
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
                                  {
                                    name: "",
                                    barcode: "",
                                    isNegativeControl: false,
                                  },
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
                      </Accordion.Item>
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
      <CheckBox
        color="secondary"
        name={`samples.${index}.isNegativeControl`}
        label="Negative control"
        className="col-span-full w-fit"
      />
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
