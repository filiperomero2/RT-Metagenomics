import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { ThemeSwitcher } from "@/components/state-components/theme-switcher";
import {
  useSaveSettings,
  useSettings,
  useUpdateKronaDatabase,
} from "@/hooks/use-settings";
import { DEFAULT_SETTINGS, type SettingsData } from "@/types/settings";
import { Button, Card, Spinner, toast } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Database,
  Palette,
  RotateCcw,
  Save,
  Settings2,
  Timer,
} from "lucide-react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings } = useSettings();
  const { mutateAsync: saveSettings, isPending } = useSaveSettings();
  const { mutate: updateKronaDatabase, isPending: isUpdatingKrona } =
    useUpdateKronaDatabase();

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
  const savedKronaPath =
    settings?.databases.krona ?? DEFAULT_SETTINGS.databases.krona;
  const hasUnsavedKronaPathChanges = kronaPath !== savedKronaPath;

  const onSave = async (data: SettingsData) => {
    const savedSettings = await saveSettings(data);
    reset(savedSettings);
    toast.success("Your settings have been saved.");
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
              <Card.Content>
                <Input
                  name="databases.kraken2"
                  label="Database Path"
                  placeholder="/path/to/kraken2/db"
                  isFolderSelector
                />
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
                  name="databases.diamond.assembly-summary"
                  label="Assembly Summary Path"
                  placeholder="/path/to/diamond/assembly-summary"
                  isFolderSelector
                />
                <Input
                  name="databases.diamond.taxid-to-family"
                  label="Taxid to Family Path"
                  placeholder="/path/to/diamond/taxid-to-family"
                  isFolderSelector
                />
              </Card.Content>
            </Card>
          </section>
        </motion.div>
      </form>
    </FormProvider>
  );
}
