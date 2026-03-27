import { contextBridge, ipcRenderer } from "electron";
import type {
  BackendLogEntry,
  BackendProcessEvent,
  BackendStartResult,
  BackendState,
} from "../shared/types/backend";

// Custom APIs for renderer
const api = {
  minimizeWindow: () => {
    ipcRenderer.send("window:minimize");
  },
  maximizeWindow: () => {
    ipcRenderer.send("window:maximize");
  },
  closeWindow: () => {
    ipcRenderer.send("window:close");
  },
  openBackendMonitorWindow: () => {
    return ipcRenderer.invoke("window:openBackendMonitor");
  },
  reattachBackendMonitorWindow: () => {
    return ipcRenderer.invoke("window:reattachBackendMonitor");
  },
  getBackendMonitorWindowState: () => {
    return ipcRenderer.invoke("window:getBackendMonitorState") as Promise<boolean>;
  },
  onIsMaximized: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on("window:isMaximized", (_, isMaximized: boolean) => callback(isMaximized));
  },
  onBackendMonitorWindowState: (callback: (isOpen: boolean) => void) => {
    const listener = (_: unknown, isOpen: boolean) => callback(isOpen);
    ipcRenderer.on("window:backendMonitorState", listener);
    return () => {
      ipcRenderer.off("window:backendMonitorState", listener);
    };
  },
  startBackend: () => {
    return ipcRenderer.invoke("backend:start") as Promise<BackendStartResult>;
  },
  stopBackend: () => {
    return ipcRenderer.invoke("backend:stop") as Promise<BackendState>;
  },
  getBackendState: () => {
    return ipcRenderer.invoke("backend:state") as Promise<BackendState>;
  },
  getBackendLogs: () => {
    return ipcRenderer.invoke("backend:logs") as Promise<BackendLogEntry[]>;
  },
  onBackendProcessEvent: (callback: (event: BackendProcessEvent) => void) => {
    const listener = (_: unknown, event: BackendProcessEvent) => callback(event);
    ipcRenderer.on("backend:process-event", listener);
    return () => {
      ipcRenderer.off("backend:process-event", listener);
    };
  },
  onBackendLog: (callback: (log: BackendLogEntry) => void) => {
    const listener = (_: unknown, log: BackendLogEntry) => callback(log);
    ipcRenderer.on("backend:log", listener);
    return () => {
      ipcRenderer.off("backend:log", listener);
    };
  },
  onBackendLogsCleared: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("backend:logs-cleared", listener);
    return () => {
      ipcRenderer.off("backend:logs-cleared", listener);
    };
  },
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.api = api;
}
