import { Input } from "@/mainview/components/form/input";
import { NumberInput } from "@/mainview/components/form/number-input";
import { ThemeSwitcher } from "@/mainview/components/state-components/theme-switcher";
import { SETTINGS_STORAGE_KEY } from "@/mainview/constants/local-storage";
import { Accordion, Button, Card, toast } from "@heroui/react";
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
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

interface DatabasePaths {
  krona: string;
  kraken2: string;
  diamond: {
    taxdump: string;
    "assembly-summary": string;
    "taxid-to-family": string;
  };
}

export interface SettingsData {
  polling_interval: number;
  iteration_interval: number;
  databases: DatabasePaths;
}

const DEFAULT_SETTINGS: SettingsData = {
  polling_interval: 5,
  iteration_interval: 10,
  databases: {
    krona: "",
    kraken2: "",
    diamond: {
      taxdump: "",
      "assembly-summary": "",
      "taxid-to-family": "",
    },
  },
};

function loadSettings(): SettingsData {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        databases: {
          ...DEFAULT_SETTINGS.databases,
          ...parsed.databases,
          diamond: {
            ...DEFAULT_SETTINGS.databases.diamond,
            ...parsed.databases?.diamond,
          },
        },
      };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: SettingsData) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const methods = useForm<SettingsData>({
    defaultValues: DEFAULT_SETTINGS,
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    const settings = loadSettings();
    reset(settings);
  }, [reset]);

  const onSave = (data: SettingsData) => {
    saveSettings(data);
    reset(data);
    toast.success("Your settings have been saved to local storage.");
  };

  const onReset = () => {
    saveSettings(DEFAULT_SETTINGS);
    reset(DEFAULT_SETTINGS);
    toast.warning("All settings have been restored to defaults.");
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
            <Button variant="danger-soft" onPress={onReset} size="sm">
              <RotateCcw size={16} />
              Reset
            </Button>
            <Button type="submit" isDisabled={!isDirty} size="sm">
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
                    isFolderSelector
                  />
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
