import { contextBridge, ipcRenderer } from "electron";
import type {
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
  onIsMaximized: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on("window:isMaximized", (_, isMaximized: boolean) => callback(isMaximized));
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
  onBackendProcessEvent: (callback: (event: BackendProcessEvent) => void) => {
    const listener = (_: unknown, event: BackendProcessEvent) => callback(event);
    ipcRenderer.on("backend:process-event", listener);
    return () => {
      ipcRenderer.off("backend:process-event", listener);
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
