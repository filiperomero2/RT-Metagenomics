import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  addToast,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import {
  Save,
  RotateCcw,
  Database,
  Settings2,
  Timer,
  Palette,
} from "lucide-react";
import { motion } from "framer-motion";
import { useForm, FormProvider } from "react-hook-form";
import { Input } from "@/components/form/input";
import { NumberInput } from "@/components/form/number-input";
import { SETTINGS_STORAGE_KEY } from "@/constants/local-storage";
import { ThemeSwitcher } from "@/components/state-components/theme-switcher";

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
    addToast({
      title: "Settings saved",
      description: "Your settings have been saved to local storage.",
      color: "success",
    });
  };

  const onReset = () => {
    saveSettings(DEFAULT_SETTINGS);
    reset(DEFAULT_SETTINGS);
    addToast({
      title: "Settings reset",
      description: "All settings have been restored to defaults.",
      color: "warning",
    });
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
              variant="flat"
              color="warning"
              startContent={<RotateCcw size={16} />}
              onPress={onReset}
              size="sm"
            >
              Reset
            </Button>
            <Button
              type="submit"
              color="primary"
              startContent={<Save size={16} />}
              isDisabled={!isDirty}
              size="sm"
            >
              Save
            </Button>
          </div>
        </div>
        <motion.div
          className="grid grid-cols-[1fr_2fr] gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4">
            <Card shadow="sm">
              <CardHeader className="flex items-center gap-3 px-6 pt-5 pb-0">
                <Palette className="text-primary" size={20} />
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Appearance
                </h2>
              </CardHeader>
              <CardBody className="flex flex-row items-center justify-between px-6 py-5">
                <span className="text-foreground-700 text-sm">Dark Mode</span>
                <ThemeSwitcher />
              </CardBody>
            </Card>

            <Card shadow="sm">
              <CardHeader className="flex items-center gap-3 px-6 pt-5 pb-0">
                <Timer className="text-primary" size={20} />
                <h2 className="text-foreground-800 text-xl font-semibold">
                  Intervals
                </h2>
              </CardHeader>
              <CardBody className="px-6 py-5">
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
              </CardBody>
            </Card>
          </div>

          <Card shadow="sm">
            <CardHeader className="flex items-center gap-3 px-6 pt-5 pb-0">
              <Database className="text-primary" size={20} />
              <h2 className="text-foreground-800 text-xl font-semibold">
                Databases
              </h2>
            </CardHeader>
            <CardBody className="px-6 py-5">
              <Accordion
                variant="light"
                selectedKeys={["krona", "kraken2", "diamond"]}
              >
                {/* Krona */}
                <AccordionItem
                  key="krona"
                  aria-label="Krona"
                  title={
                    <span className="text-foreground-700 font-medium">
                      Krona
                    </span>
                  }
                >
                  <Input
                    name="databases.krona"
                    label="Database Path"
                    placeholder="/path/to/krona/db"
                    isFolderSelector
                  />
                </AccordionItem>

                {/* Kraken2 */}
                <AccordionItem
                  key="kraken2"
                  aria-label="Kraken2"
                  title={
                    <span className="text-foreground-700 font-medium">
                      Kraken2
                    </span>
                  }
                >
                  <Input
                    name="databases.kraken2"
                    label="Database Path"
                    placeholder="/path/to/kraken2/db"
                    isFolderSelector
                  />
                </AccordionItem>

                {/* Diamond */}
                <AccordionItem
                  key="diamond"
                  aria-label="Diamond"
                  title={
                    <span className="text-foreground-700 font-medium">
                      Diamond
                    </span>
                  }
                >
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
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </motion.div>
      </form>
    </FormProvider>
  );
}
