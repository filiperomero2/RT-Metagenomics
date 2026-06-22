import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, dialog, shell } from "electron";
import { join } from "path";
import iconIco from "../renderer/public/logo.ico";
import icon from "../renderer/public/logo.png";
import { stopBackendProcess } from "./backend-process";
import { setupEvents, setupIpcHandlers } from "./events";
import { backendMonitorWindow } from "./backend-monitor-window";
import { isFirstRunSetupComplete, runFirstRunSetup } from "./first-run-setup";
import {
  closeSetupWindow,
} from "./setup-window";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 900,
    minHeight: 720,
    show: false,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    roundedCorners: true,
    ...(process.platform === "linux" ? { icon } : { icon: iconIco }),
    webPreferences: {
      preload: join(__dirname, "../../out/preload/index.mjs"),
      sandbox: false,
    },
  });

  setupEvents(mainWindow);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // First-run setup: WSL platform, Linux distro, and conda environment.
  if (!is.dev && !(await isFirstRunSetupComplete())) {
    try {
      const setupResult = await runFirstRunSetup();
      if (setupResult === "reboot") {
        app.quit();
        return;
      }
    } catch (err) {
      closeSetupWindow();
      dialog.showErrorBox(
        "Setup Failed",
        `RT-Metagenomics could not set up its environment:\n\n${err instanceof Error ? err.message : String(err)}`,
      );
      app.quit();
      return;
    }
  }

  createWindow();

  setupIpcHandlers(mainWindow!);

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await stopBackendProcess();
  backendMonitorWindow?.close();
});
