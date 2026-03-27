import { is } from "@electron-toolkit/utils";
import { BrowserWindow, ipcMain } from "electron";
import {
  closeBackendMonitorWindow,
  isBackendMonitorWindowOpen,
  openBackendMonitorWindow,
} from "./backend-monitor-window";
import { registerBackendIpcHandlers } from "./backend-process";

export function setupEvents(mainWindow: BrowserWindow) {
  mainWindow.on("ready-to-show", () => {
    mainWindow!.show();
    if (is.dev) {
      mainWindow!.webContents.openDevTools({ mode: "detach" });
    }
  });

  mainWindow.on("maximize", () => {
    mainWindow!.webContents.send("window:isMaximized", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow!.webContents.send("window:isMaximized", false);
  });
}

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  registerBackendIpcHandlers();
  ipcMain.removeHandler("window:openBackendMonitor");
  ipcMain.removeHandler("window:getBackendMonitorState");
  ipcMain.removeHandler("window:reattachBackendMonitor");
  ipcMain.removeHandler("window:getIsMaximized");
  ipcMain.handle("window:openBackendMonitor", async () => {
    openBackendMonitorWindow(mainWindow);
  });
  ipcMain.handle("window:getBackendMonitorState", async () => {
    return isBackendMonitorWindowOpen();
  });
  ipcMain.handle("window:reattachBackendMonitor", async () => {
    closeBackendMonitorWindow(mainWindow);
  });
  ipcMain.handle("window:getIsMaximized", async (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() ?? false;
  });

  // IPC handlers for window controls
  ipcMain.on("window:minimize", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  ipcMain.on("window:maximize", (event) => {
    const targetWindow = BrowserWindow.fromWebContents(event.sender);

    if (targetWindow) {
      if (targetWindow.isMaximized()) {
        targetWindow.unmaximize();
      } else {
        targetWindow.maximize();
      }
    }
  });
  ipcMain.on("window:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}
