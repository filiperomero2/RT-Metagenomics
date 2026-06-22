import { BrowserWindow } from "electron";
import type { SetupStepId } from "./wsl-setup";

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
      gap: 14px;
      padding: 28px 32px;
      -webkit-app-region: drag;
      user-select: none;
    }
    h1 { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    .subtitle {
      font-size: 13px;
      color: #888;
      text-align: center;
      max-width: 380px;
      line-height: 1.6;
    }
    .steps {
      width: 100%;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 4px;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #666;
    }
    .step.active { color: #c7c7dd; }
    .step.done { color: #8b8ba8; }
    .step.error { color: #f87171; }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #333;
      flex-shrink: 0;
    }
    .step.active .dot {
      border-color: #8b5cf6;
      background: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25);
    }
    .step.done .dot {
      border-color: #6366f1;
      background: #6366f1;
    }
    .step.error .dot {
      border-color: #f87171;
      background: #f87171;
    }
    #status {
      font-size: 13px;
      color: #a0a0b8;
      min-height: 36px;
      text-align: center;
      max-width: 380px;
      line-height: 1.5;
    }
    .track {
      width: 320px;
      height: 4px;
      background: #1e1e2e;
      border-radius: 2px;
      overflow: hidden;
      margin-top: 2px;
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
    One-time setup for Windows: WSL2, Linux environment, and bioinformatics tools.
  </p>
  <div class="steps">
    <div class="step" id="step-wsl"><span class="dot"></span><span>Install WSL2 platform</span></div>
    <div class="step" id="step-distro"><span class="dot"></span><span>Create Linux environment</span></div>
    <div class="step" id="step-conda"><span class="dot"></span><span>Install analysis tools</span></div>
  </div>
  <p id="status">Preparing…</p>
  <div class="track"><div class="bar"></div></div>
</body>
</html>`;

const STEP_STATES = ["pending", "active", "done", "error"] as const;

function runInSetupWindow(script: string): void {
  if (setupWindow && !setupWindow.isDestroyed()) {
    void setupWindow.webContents.executeJavaScript(script);
  }
}

export function createSetupWindow(): BrowserWindow {
  setupWindow = new BrowserWindow({
    width: 520,
    height: 360,
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
  runInSetupWindow(
    `document.getElementById('status').textContent = ${JSON.stringify(message)}`,
  );
}

export function updateSetupStep(
  step: SetupStepId,
  state: (typeof STEP_STATES)[number],
): void {
  for (const id of ["wsl", "distro", "conda"] as SetupStepId[]) {
    const stepState = id === step ? state : undefined;
    if (!stepState) continue;

    runInSetupWindow(`
      (() => {
        const el = document.getElementById('step-${id}');
        if (!el) return;
        el.classList.remove('pending', 'active', 'done', 'error');
        el.classList.add(${JSON.stringify(stepState)});
      })();
    `);
  }
}

export function markSetupStepsCompleteThrough(step: SetupStepId): void {
  const order: SetupStepId[] = ["wsl", "distro", "conda"];
  const targetIndex = order.indexOf(step);

  for (let index = 0; index < order.length; index += 1) {
    const id = order[index];
    if (index < targetIndex) {
      updateSetupStep(id, "done");
    } else if (index === targetIndex) {
      updateSetupStep(id, "done");
    }
  }
}

export function closeSetupWindow(): void {
  if (setupWindow && !setupWindow.isDestroyed()) {
    setupWindow.close();
  }
  setupWindow = null;
}
