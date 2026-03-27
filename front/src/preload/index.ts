import { contextBridge, ipcRenderer } from "electron";

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
