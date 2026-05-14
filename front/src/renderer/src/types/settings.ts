export interface Kraken2DatabaseConfig {
  name: string;
  value: string;
  is_default: boolean;
}

export interface DatabasePaths {
  krona: string;
  taxdump: string;
  kraken2: Kraken2DatabaseConfig[];
  diamond: string;
  viral: {
    genomes: string;
    taxids: string;
  };
  deacon: string;
}

export interface SettingsData {
  polling_interval: number;
  iteration_interval: number;
  databases: DatabasePaths;
}

export const DEFAULT_SETTINGS: SettingsData = {
  polling_interval: 5,
  iteration_interval: 10,
  databases: {
    krona: "",
    taxdump: "",
    kraken2: [],
    diamond: "",
    viral: {
      genomes: "",
      taxids: "",
    },
    deacon: "",
  },
};

export function mergeSettings(
  settings?: Partial<SettingsData> | null,
): SettingsData {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    databases: {
      ...DEFAULT_SETTINGS.databases,
      ...settings?.databases,
      taxdump:
        settings?.databases?.taxdump ?? DEFAULT_SETTINGS.databases.taxdump,
      diamond:
        settings?.databases?.diamond ?? DEFAULT_SETTINGS.databases.diamond,
      viral: {
        ...DEFAULT_SETTINGS.databases.viral,
        ...settings?.databases?.viral,
      },
      deacon:
        settings?.databases?.deacon ?? DEFAULT_SETTINGS.databases.deacon,
    },
  };
}

export function getDefaultKraken2DatabasePath(
  databases?: Kraken2DatabaseConfig[] | null,
): string {
  return databases?.find((database) => database.is_default)?.value ?? "";
}
