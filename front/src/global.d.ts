import type { ElectronAPI } from "@electron-toolkit/preload";
import type {
  BackendProcessEvent,
  BackendStartResult,
  BackendState,
} from "./shared/types/backend";

declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      onIsMaximized: (callback: (isMaximized: boolean) => void) => void;
      startBackend: () => Promise<BackendStartResult>;
      stopBackend: () => Promise<BackendState>;
      getBackendState: () => Promise<BackendState>;
      onBackendProcessEvent: (
        callback: (event: BackendProcessEvent) => void,
      ) => () => void;
    };
  }
}

export {};
