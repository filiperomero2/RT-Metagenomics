import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { ThemeSwitcher } from "@/components/state-components/theme-switcher";
import {
  useInstallKraken2Database,
  useSaveSettings,
  useSettings,
  useUpdateKronaDatabase,
} from "@/hooks/use-settings";
import {
  DEFAULT_SETTINGS,
  getDefaultKraken2DatabasePath,
  type Kraken2DatabaseConfig,
  type SettingsData,
} from "@/types/settings";
import {
  Button,
  Card,
  InputGroup,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Database,
  Download,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  Timer,
} from "lucide-react";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSettings();
  const { mutateAsync: saveSettings, isPending } = useSaveSettings();
  const { mutate: updateKronaDatabase, isPending: isUpdatingKrona } =
    useUpdateKronaDatabase();
  const {
    mutateAsync: installKraken2Database,
    isPending: isInstallingKraken2,
  } = useInstallKraken2Database();
  const [kraken2InstallUrl, setKraken2InstallUrl] = useState("");

  const methods = useForm<SettingsData>({
    values: settings ?? DEFAULT_SETTINGS,
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;
  const kronaPath = useWatch({
    control: methods.control,
    name: "databases.krona",
  });
  const kraken2Databases = useWatch({
    control: methods.control,
    name: "databases.kraken2",
  });
  const savedKronaPath =
    settings?.databases.krona ?? DEFAULT_SETTINGS.databases.krona;
  const hasUnsavedKronaPathChanges = kronaPath !== savedKronaPath;
  const defaultKraken2DatabasePath =
    getDefaultKraken2DatabasePath(kraken2Databases);

  const onSave = async (data: SettingsData) => {
    const savedSettings = await saveSettings(data);
    reset(savedSettings);
    toast.success("Your settings have been saved.");
  };

  const setDefaultKraken2Database = (value: string) => {
    methods.setValue(
      "databases.kraken2",
      (kraken2Databases ?? []).map((database) => ({
        ...database,
        is_default: database.value === value,
      })),
      { shouldDirty: true },
    );
  };

  const installKraken2 = async () => {
    const result = await installKraken2Database(
      kraken2InstallUrl.trim() || undefined,
    );
    const currentDatabases = kraken2Databases ?? [];
    const alreadyExists = currentDatabases.some(
      (database) => database.value === result.kraken2Database,
    );

    if (alreadyExists) {
      setKraken2InstallUrl("");
      return;
    }

    const nextDatabases: Kraken2DatabaseConfig[] = [
      ...currentDatabases,
      {
        name: result.name,
        value: result.kraken2Database,
        is_default: currentDatabases.length === 0,
      },
    ];
    methods.setValue("databases.kraken2", nextDatabases, {
      shouldDirty: currentDatabases.length === 0,
    });
    setKraken2InstallUrl("");
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSave)}
        className="mx-auto w-full space-y-6 p-6"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 className="text-primary" size={28} />
            <h1 className="text-foreground text-3xl font-bold">Settings</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              isDisabled={!isDirty}
              isPending={isPending}
              size="sm"
            >
              <Save size={16} />
              Save
            </Button>
          </div>
        </div>
        <motion.div
          className="grid grid-cols-[1fr_2fr] gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <section className="space-y-4">
            <Card>
              <Card.Header className="mb-2 flex flex-row items-center justify-between">
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Appearance
                </h2>
                <Palette className="text-primary" size={20} />
              </Card.Header>
              <Card.Content>
                <ThemeSwitcher />
              </Card.Content>
            </Card>

            <Card>
              <Card.Header className="mb-2 flex flex-row items-center justify-between">
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Intervals
                </h2>
                <Timer className="text-primary" size={20} />
              </Card.Header>
              <Card.Content className="gap-3">
                <NumberInput
                  name="polling_interval"
                  label="Polling Interval (seconds)"
                  description="How often the system checks for new data."
                />
                <NumberInput
                  name="iteration_interval"
                  label="Iteration Interval (seconds)"
                  description="Time between processing iterations."
                />
              </Card.Content>
            </Card>
          </section>

          <section className="space-y-4">
            <Card>
              <Card.Header className="mb-2 flex flex-row items-center justify-between">
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Krona
                </h2>
                <Database className="text-primary" size={20} />
              </Card.Header>
              <Card.Content>
                <div className="flex flex-col gap-3">
                  <Input
                    name="databases.krona"
                    label="Database Path"
                    placeholder="/path/to/krona/db"
                    isDisabled={isUpdatingKrona}
                    isFolderSelector
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-muted text-sm">
                      Updates use the saved Krona path from your settings.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      isPending={isUpdatingKrona}
                      isDisabled={hasUnsavedKronaPathChanges || !savedKronaPath}
                      onPress={() => updateKronaDatabase()}
                    >
                      {isUpdatingKrona ? <Spinner /> : <RotateCcw size={16} />}
                      {isUpdatingKrona ? "Updating..." : "Update Krona"}
                    </Button>
                  </div>
                  {hasUnsavedKronaPathChanges && (
                    <p className="text-warning text-sm">
                      Save the new Krona path before running the update.
                    </p>
                  )}
                </div>
              </Card.Content>
            </Card>
            <Card>
              <Card.Header className="mb-2 flex flex-row items-center justify-between">
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Kraken2
                </h2>
                <Database className="text-primary" size={20} />
              </Card.Header>
              <Card.Content className="gap-3">
                <div className="flex flex-col gap-2">
                  <p className="text-muted text-sm">
                    Installed databases found in the Kraken2 base directory.
                    Select which one should be the default.
                  </p>
                  {kraken2Databases?.length ? (
                    kraken2Databases.map((database) => {
                      const isDefault =
                        database.value === defaultKraken2DatabasePath;

                      return (
                        <button
                          key={database.value}
                          type="button"
                          className={`rounded-lg border px-3 py-2 text-left transition ${
                            isDefault
                              ? "border-primary bg-primary/10"
                              : "border-default-200 bg-content2 hover:border-primary/50"
                          }`}
                          onClick={() =>
                            setDefaultKraken2Database(database.value)
                          }
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-medium">{database.name}</p>
                              <p className="text-muted text-xs break-all">
                                {database.value}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                isDefault
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-default-100 text-default-700"
                              }`}
                            >
                              {isDefault ? "Default" : "Set default"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="text-muted rounded-lg border border-dashed px-3 py-4 text-sm">
                      No Kraken2 databases were found in the base directory yet.
                    </p>
                  )}
                </div>

                <TextField
                  value={kraken2InstallUrl}
                  onChange={(event) => setKraken2InstallUrl(event.target.value)}
                  variant="secondary"
                  isDisabled={isInstallingKraken2}
                >
                  <Label>Install URL (optional)</Label>
                  <InputGroup>
                    <InputGroup.Input placeholder="https://.../k2_database.tar.gz" />
                  </InputGroup>
                </TextField>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted text-sm">
                    Leave the URL blank to install the default Kraken2 archive.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    isPending={isInstallingKraken2}
                    onPress={() => void installKraken2()}
                  >
                    {isInstallingKraken2 ? <Spinner /> : <Download size={16} />}
                    {isInstallingKraken2 ? "Installing..." : "Install new"}
                  </Button>
                </div>
              </Card.Content>
            </Card>
            <Card>
              <Card.Header className="mb-2 flex flex-row items-center justify-between">
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Diamond
                </h2>
                <Database className="text-primary" size={20} />
              </Card.Header>
              <Card.Content className="gap-3">
                <Input
                  name="databases.diamond.taxdump"
                  label="Taxdump Path"
                  placeholder="/path/to/diamond/taxdump"
                  isFolderSelector
                />
                <Input
                  name="databases.diamond.taxids"
                  label="Diamond taxids (protein2taxid.tsv)"
                  placeholder="/path/to/protein2taxid.tsv"
                />
              </Card.Content>
            </Card>
          </section>
        </motion.div>
      </form>
    </FormProvider>
  );
}
