import { is } from "@electron-toolkit/utils";
import { BrowserWindow, ipcMain } from "electron";
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

  // IPC handlers for window controls
  ipcMain.on("window:minimize", () => {
    console.log("Minimize window");
    if (mainWindow) mainWindow.minimize();
  });
  ipcMain.on("window:maximize", () => {
    console.log("Maximize/Restore window");
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });
  ipcMain.on("window:close", () => {
    console.log("Close window");
    if (mainWindow) mainWindow.close();
  });
}
