import { app, BrowserWindow, ipcMain } from "electron";
import {
  ChildProcessByStdio,
  execFile,
  spawn
} from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { Stream } from "node:stream";
import { promisify } from "node:util";
import {
  createBackendLogEntry,
  MAX_BACKEND_LOG_LINES,
} from "../shared/backend-log";
import type {
  BackendLogEntry,
  BackendProcessEvent,
  BackendStartResult,
  BackendState,
} from "../shared/types/backend";

const BACKEND_CMD = [
  'eval "$(conda shell.bash hook)"',
  "conda activate rt-meta",
  "exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug",
].join(" && ");

let backendProcess: ChildProcessByStdio<
  null,
  Stream.Readable,
  Stream.Readable
> | null = null;
let backendLogs: BackendLogEntry[] = [];
let nextBackendLogId = 0;
let stdoutBuffer = "";
let stderrBuffer = "";

const execFileAsync = promisify(execFile);

function broadcastBackendEvent(event: BackendProcessEvent) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("backend:process-event", event);
    }
  }
}

function broadcastBackendLog(log: BackendLogEntry) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("backend:log", log);
    }
  }
}

function resetBackendLogs() {
  backendLogs = [];

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("backend:logs-cleared");
    }
  }
}

function appendBackendLog(line: string) {
  const entry = createBackendLogEntry(nextBackendLogId++, line);
  backendLogs = [...backendLogs, entry].slice(-MAX_BACKEND_LOG_LINES);
  broadcastBackendLog(entry);
}

function resolveBackendCwd() {
  const candidates = [
    path.resolve(app.getAppPath(), "../back/app"),
    path.resolve(process.cwd(), "../back/app"),
    path.resolve(app.getAppPath(), "back/app"),
    path.resolve(process.cwd(), "back/app"),
  ];

  const cwd = candidates.find((candidate) => existsSync(candidate));
  if (!cwd) {
    throw new Error(
      "Unable to locate the backend app directory. Expected a back/app folder next to the Electron app.",
    );
  }

  return cwd;
}

function resetBuffers() {
  stdoutBuffer = "";
  stderrBuffer = "";
}

function setBuffer(stream: "stdout" | "stderr", value: string) {
  if (stream === "stdout") {
    stdoutBuffer = value;
    return;
  }

  stderrBuffer = value;
}

function getBuffer(stream: "stdout" | "stderr") {
  return stream === "stdout" ? stdoutBuffer : stderrBuffer;
}

function emitBufferedOutput(stream: "stdout" | "stderr", chunk: string) {
  const lines = `${getBuffer(stream)}${chunk}`.split(/\r?\n/);
  setBuffer(stream, lines.pop() ?? "");

  for (const line of lines) {
    if (line.trim()) {
      appendBackendLog(line);
    }
  }
}

function flushBufferedOutput(stream: "stdout" | "stderr") {
  const buffer = getBuffer(stream);
  if (buffer.trim()) {
    appendBackendLog(buffer);
  }
  setBuffer(stream, "");
}

export function getBackendState(): BackendState {
  return {
    isRunning: backendProcess !== null,
    pid: backendProcess?.pid ?? null,
  };
}

export function getBackendLogs() {
  return backendLogs;
}

export function startBackendProcess(): BackendStartResult {
  const currentState = getBackendState();
  if (currentState.isRunning) {
    appendBackendLog(
      `[system] Backend process already running${currentState.pid ? ` (PID ${currentState.pid})` : ""}`,
    );
    return {
      alreadyRunning: true,
      pid: currentState.pid,
    };
  }

  resetBackendLogs();
  appendBackendLog("[system] Activating conda env and starting uvicorn...");

  const child = spawn("bash", ["-lc", BACKEND_CMD], {
    cwd: resolveBackendCwd(),
    detached: process.platform !== "win32",
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  resetBuffers();
  backendProcess = child;
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");

  child.stdout.on("data", (chunk: string) => {
    emitBufferedOutput("stdout", chunk);
  });

  child.stderr.on("data", (chunk: string) => {
    emitBufferedOutput("stderr", chunk);
  });

  child.once("spawn", () => {
    appendBackendLog(
      `[system] Backend process started${child.pid ? ` (PID ${child.pid})` : ""}`,
    );
    broadcastBackendEvent({
      type: "started",
      pid: child.pid ?? null,
    });
  });

  child.once("error", (error) => {
    appendBackendLog(`[system] Failed to start backend: ${error.message}`);
  });

  child.once("exit", (code, signal) => {
    flushBufferedOutput("stdout");
    flushBufferedOutput("stderr");

    if (backendProcess === child) {
      backendProcess = null;
    }

    appendBackendLog(
      `[system] Process exited (${signal ? `signal ${signal}` : `code ${code ?? 0}`})`,
    );

    broadcastBackendEvent({
      type: "exit",
      code,
      signal,
    });
  });

  return {
    alreadyRunning: false,
    pid: child.pid ?? null,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function stopBackendProcess() {
  const child = backendProcess;
  if (!child?.pid) {
    backendProcess = null;
    return;
  }

  appendBackendLog("[system] Stopping backend...");

  if (process.platform === "win32") {
    try {
      await execFileAsync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    } catch {
      // The process may already be gone.
    }
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // The process group may already be gone.
    }

    await sleep(1000);

    try {
      process.kill(-child.pid, 0);
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // The process group exited after SIGTERM.
    }

    try {
      await execFileAsync("bash", [
        "-lc",
        "fuser -k 8000/tcp 2>/dev/null || true",
      ]);
    } catch {
      // fuser is optional.
    }
  }

  try {
    child.kill("SIGKILL");
  } catch {
    // The shell process may already be gone.
  }
}

export function registerBackendIpcHandlers() {
  ipcMain.removeHandler("backend:start");
  ipcMain.removeHandler("backend:stop");
  ipcMain.removeHandler("backend:state");
  ipcMain.removeHandler("backend:logs");

  ipcMain.handle("backend:start", async () => {
    try {
      return startBackendProcess();
    } catch (error) {
      appendBackendLog(
        `[system] Failed to start backend: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  });

  ipcMain.handle("backend:stop", async () => {
    await stopBackendProcess();
    return getBackendState();
  });

  ipcMain.handle("backend:state", async () => {
    return getBackendState();
  });

  ipcMain.handle("backend:logs", async () => {
    return getBackendLogs();
  });
}
