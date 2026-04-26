export interface Kraken2DatabaseConfig {
  name: string;
  value: string;
  is_default: boolean;
}

export interface DatabasePaths {
  krona: string;
  kraken2: Kraken2DatabaseConfig[];
  diamond: {
    taxdump: string;
    taxids: string;
  };
  viral: {
    genomes: string;
    taxids: string;
  };
  deacon: {
    host_reference: string;
    index: string;
  };
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
    kraken2: [],
    diamond: {
      taxdump: "",
      taxids: "",
    },
    viral: {
      genomes: "",
      taxids: "",
    },
    deacon: {
      host_reference: "",
      index: "",
    },
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
      diamond: {
        ...DEFAULT_SETTINGS.databases.diamond,
        ...settings?.databases?.diamond,
      },
      viral: {
        ...DEFAULT_SETTINGS.databases.viral,
        ...settings?.databases?.viral,
      },
      deacon: {
        ...DEFAULT_SETTINGS.databases.deacon,
        ...settings?.databases?.deacon,
      },
    },
  };
}

export function getDefaultKraken2DatabasePath(
  databases?: Kraken2DatabaseConfig[] | null,
): string {
  return databases?.find((database) => database.is_default)?.value ?? "";
}
