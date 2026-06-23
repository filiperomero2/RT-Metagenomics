import { is } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron";
import { join } from "node:path";
import icon from "../renderer/public/logo.png";
import iconIco from "../renderer/public/logo.ico";

export let backendMonitorWindow: BrowserWindow | null = null;

function broadcastBackendMonitorWindowStateChange() {
  const isOpen = isBackendMonitorWindowOpen();

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed() && window !== backendMonitorWindow) {
      window.webContents.send("window:backendMonitorState", isOpen);
    }
  }
}

export function isBackendMonitorWindowOpen() {
  return backendMonitorWindow !== null && !backendMonitorWindow.isDestroyed();
}

function loadBackendMonitorWindow(window: BrowserWindow) {
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    void window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/backend-monitor`);
    return;
  }

  void window.loadFile(join(__dirname, "../renderer/index.html"), {
    hash: "/backend-monitor",
  });
}

export function openBackendMonitorWindow(parentWindow?: BrowserWindow | null) {
  if (isBackendMonitorWindowOpen() && backendMonitorWindow) {
    if (backendMonitorWindow.isMinimized()) {
      backendMonitorWindow.restore();
    }

    if (!backendMonitorWindow.isVisible()) {
      backendMonitorWindow.show();
    }

    backendMonitorWindow.focus();
    return backendMonitorWindow;
  }

  backendMonitorWindow = new BrowserWindow({
    width: 760,
    height: 880,
    minWidth: 700,
    minHeight: 480,
    show: false,
    title: "Backend Monitor",
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    roundedCorners: true,
    parent:
      process.platform === "win32" ? undefined : (parentWindow ?? undefined),
    ...(process.platform === "linux" ? { icon } : { icon: iconIco }),
    webPreferences: {
      preload: join(__dirname, "../../out/preload/index.mjs"),
      sandbox: false,
      contextIsolation: true,
    },
  });

  backendMonitorWindow.on("ready-to-show", () => {
    backendMonitorWindow?.show();
    broadcastBackendMonitorWindowStateChange();
  });

  backendMonitorWindow.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error(
        "Backend monitor window failed to load:",
        errorCode,
        errorDescription,
        validatedURL,
      );
    },
  );

  backendMonitorWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Backend monitor renderer process gone:", details);
  });

  backendMonitorWindow.on("maximize", () => {
    backendMonitorWindow?.webContents.send("window:isMaximized", true);
  });

  backendMonitorWindow.on("unmaximize", () => {
    backendMonitorWindow?.webContents.send("window:isMaximized", false);
  });

  backendMonitorWindow.on("closed", () => {
    backendMonitorWindow = null;
    broadcastBackendMonitorWindowStateChange();
  });

  loadBackendMonitorWindow(backendMonitorWindow);
  return backendMonitorWindow;
}

export function closeBackendMonitorWindow(focusWindow?: BrowserWindow | null) {
  if (backendMonitorWindow && !backendMonitorWindow.isDestroyed()) {
    backendMonitorWindow.close();
  }

  if (focusWindow && !focusWindow.isDestroyed()) {
    if (focusWindow.isMinimized()) {
      focusWindow.restore();
    }
    focusWindow.focus();
  }
}
