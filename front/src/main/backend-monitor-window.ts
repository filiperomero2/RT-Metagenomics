import { is } from "@electron-toolkit/utils";
import { BrowserWindow } from "electron";
import { join } from "node:path";
import icon from "../renderer/public/logo.png";
import iconIco from "../renderer/public/logo.ico";

let backendMonitorWindow: BrowserWindow | null = null;

function broadcastBackendMonitorWindowStateChange() {
  const isOpen = isBackendMonitorWindowOpen();

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("window:backendMonitorState", isOpen);
    }
  }
}

export function isBackendMonitorWindowOpen() {
  return backendMonitorWindow !== null && !backendMonitorWindow.isDestroyed();
}

function loadBackendMonitorWindow(window: BrowserWindow) {
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    const url = new URL(process.env["ELECTRON_RENDERER_URL"]);
    url.searchParams.set("window", "backend-monitor");
    void window.loadURL(url.toString());
    return;
  }

  void window.loadFile(join(__dirname, "../renderer/index.html"), {
    query: {
      window: "backend-monitor",
    },
  });
}

export function openBackendMonitorWindow(parentWindow?: BrowserWindow | null) {
  if (isBackendMonitorWindowOpen() && backendMonitorWindow) {
    if (backendMonitorWindow.isMinimized()) {
      backendMonitorWindow.restore();
    }
    backendMonitorWindow.focus();
    return backendMonitorWindow;
  }

  backendMonitorWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 700,
    minHeight: 480,
    show: false,
    title: "Backend Monitor",
    autoHideMenuBar: true,
    roundedCorners: true,
    parent: parentWindow ?? undefined,
    ...(process.platform === "linux" ? { icon } : { icon: iconIco }),
    webPreferences: {
      preload: join(__dirname, "../../out/preload/index.mjs"),
      sandbox: false,
    },
  });

  backendMonitorWindow.on("ready-to-show", () => {
    backendMonitorWindow?.show();
  });

  backendMonitorWindow.on("closed", () => {
    backendMonitorWindow = null;
    broadcastBackendMonitorWindowStateChange();
  });

  broadcastBackendMonitorWindowStateChange();
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
