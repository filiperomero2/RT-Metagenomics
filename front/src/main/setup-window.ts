import { BrowserWindow } from "electron";

let setupWindow: BrowserWindow | null = null;

const SETUP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Setting up</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f0f17;
      color: #e2e2e8;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 32px;
      -webkit-app-region: drag;
      user-select: none;
    }
    h1 { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    .subtitle {
      font-size: 13px;
      color: #888;
      text-align: center;
      max-width: 340px;
      line-height: 1.6;
    }
    #status { font-size: 13px; color: #a0a0b8; min-height: 20px; text-align: center; }
    .track {
      width: 320px;
      height: 4px;
      background: #1e1e2e;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 4px;
    }
    .bar {
      height: 100%;
      width: 55%;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      border-radius: 2px;
      animation: slide 1.6s ease-in-out infinite;
    }
    @keyframes slide {
      0%   { margin-left: -55%; }
      100% { margin-left: 100%; }
    }
  </style>
</head>
<body>
  <h1>Setting up RT-Metagenomics</h1>
  <p class="subtitle">
    First-run setup: extracting the bioinformatics environment.<br>
    This only happens once and may take a few minutes.
  </p>
  <p id="status">Preparing…</p>
  <div class="track"><div class="bar"></div></div>
</body>
</html>`;

export function createSetupWindow(): BrowserWindow {
  setupWindow = new BrowserWindow({
    width: 480,
    height: 270,
    frame: false,
    resizable: false,
    center: true,
    show: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  void setupWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(SETUP_HTML)}`,
  );

  setupWindow.once("ready-to-show", () => {
    setupWindow?.show();
  });

  return setupWindow;
}

export function updateSetupStatus(message: string): void {
  if (setupWindow && !setupWindow.isDestroyed()) {
    void setupWindow.webContents.executeJavaScript(
      `document.getElementById('status').textContent = ${JSON.stringify(message)}`,
    );
  }
}

export function closeSetupWindow(): void {
  if (setupWindow && !setupWindow.isDestroyed()) {
    setupWindow.close();
  }
  setupWindow = null;
}
