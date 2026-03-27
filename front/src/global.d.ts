import type { ElectronAPI } from "@electron-toolkit/preload";
import type {
  BackendLogEntry,
  BackendProcessEvent,
  BackendStartResult,
  BackendState,
} from "./shared/types/backend";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      minimizeWindow: () => void;
      getIsMaximized: () => Promise<boolean>;
      maximizeWindow: () => void;
      closeWindow: () => void;
      openBackendMonitorWindow: () => Promise<void>;
      reattachBackendMonitorWindow: () => Promise<void>;
      getBackendMonitorWindowState: () => Promise<boolean>;
      onIsMaximized: (callback: (isMaximized: boolean) => void) => () => void;
      onBackendMonitorWindowState: (
        callback: (isOpen: boolean) => void,
      ) => () => void;
      startBackend: () => Promise<BackendStartResult>;
      stopBackend: () => Promise<BackendState>;
      getBackendState: () => Promise<BackendState>;
      getBackendLogs: () => Promise<BackendLogEntry[]>;
      onBackendProcessEvent: (
        callback: (event: BackendProcessEvent) => void,
      ) => () => void;
      onBackendLog: (callback: (log: BackendLogEntry) => void) => () => void;
      onBackendLogsCleared: (callback: () => void) => () => void;
    };
  }
}

export {};
