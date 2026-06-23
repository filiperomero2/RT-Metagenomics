import { app, BrowserWindow, ipcMain } from "electron";
import { is } from "@electron-toolkit/utils";
import { ChildProcessByStdio, execFile, spawn } from "node:child_process";
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
import {
  ensureWslCondaRuntime,
  getCondaEnvDir,
  getEnvBin,
  isEnvReadyAsync,
  usesWslBackend,
} from "./env-setup";
import { isWslDevBackendAvailable } from "./wsl-conda-env";
import { buildWslBackendLaunchScript, buildWslDevBackendLaunchScript, bootstrapRtMetaDistro, getWslBashLcArgs, runWslBash, WSL_BACKEND_DIR } from "./wsl";

const BACKEND_HEALTHCHECK_URL = "http://127.0.0.1:8000/v1/health";

let envReadyCache: boolean | null = null;

async function ensureProductionEnvReady(): Promise<boolean> {
  if (is.dev) {
    return false;
  }
  if (envReadyCache === true) {
    return true;
  }
  const ready = await isEnvReadyAsync();
  if (ready) {
    envReadyCache = true;
  }
  return ready;
}

async function getBackendSpawnArgs(
  cwd: string,
): Promise<{ cmd: string; args: string[] }> {
  if (!is.dev && (await ensureProductionEnvReady())) {
    if (usesWslBackend()) {
      const script = buildWslBackendLaunchScript({
        appVersion: app.getVersion(),
      });
      return {
        cmd: "wsl.exe",
        args: getWslBashLcArgs(script),
      };
    }

    return {
      cmd: getEnvBin("uvicorn"),
      args: [
        "main:app",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--log-level",
        "info",
      ],
    };
  }

  if (process.platform === "win32") {
    if (is.dev && (await isWslDevBackendAvailable())) {
      const script = buildWslDevBackendLaunchScript({
        backendCwd: cwd,
        appVersion: app.getVersion(),
      });
      return {
        cmd: "wsl.exe",
        args: getWslBashLcArgs(script),
      };
    }

    const WIN_CMD =
      "conda activate rt-meta && uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug";
    return { cmd: "cmd.exe", args: ["/c", WIN_CMD] };
  }

  const UNIX_CMD = [
    'eval "$(conda shell.bash hook)"',
    "conda activate rt-meta",
    "exec uvicorn main:app --host 0.0.0.0 --port 8000 --log-level debug",
  ].join(" && ");

  return { cmd: "bash", args: ["-lc", UNIX_CMD] };
}

let backendProcess: ChildProcessByStdio<
  null,
  Stream.Readable,
  Stream.Readable
> | null = null;
let backendLogs: BackendLogEntry[] = [];
let nextBackendLogId = 0;
let stdoutBuffer = "";
let stderrBuffer = "";
let backendOwnership: "managed" | "attached" | null = null;
let usingWslSpawn = false;

async function usesWslSpawnMode(): Promise<boolean> {
  if (process.platform !== "win32") {
    return false;
  }
  if (!is.dev && usesWslBackend() && (await ensureProductionEnvReady())) {
    return true;
  }
  return is.dev && (await isWslDevBackendAvailable());
}

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

function resolveBackendCwd(): string {
  if (!is.dev) {
    const resourcesBackend = path.join(process.resourcesPath, "back", "app");
    if (existsSync(resourcesBackend)) return resourcesBackend;
  }

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

async function buildBackendSpawnEnv(cwd: string): Promise<NodeJS.ProcessEnv> {
  const spawnEnv = { ...process.env };

  if (await usesWslSpawnMode()) {
    spawnEnv.RT_META_WSL = "1";
    return spawnEnv;
  }

  if (!is.dev && (await ensureProductionEnvReady())) {
    const envBinDir =
      process.platform === "win32"
        ? path.join(getCondaEnvDir(), "Scripts")
        : path.join(getCondaEnvDir(), "bin");
    const sep = process.platform === "win32" ? ";" : ":";
    spawnEnv.PATH = `${envBinDir}${sep}${process.env.PATH ?? ""}`;
    spawnEnv.CONDA_PREFIX = getCondaEnvDir();
    spawnEnv.CONDA_DEFAULT_ENV = "rt-meta";

    const dbPath = path.join(app.getPath("userData"), "rtmeta.db");
    spawnEnv.DATABASE_URL = `sqlite:///${dbPath.replace(/\\/g, "/")}`;

    const viralunityPath = path.join(cwd, "viralunity");
    const pythonPathEntries = [viralunityPath, process.env.PYTHONPATH].filter(
      (entry): entry is string => Boolean(entry),
    );
    spawnEnv.PYTHONPATH = pythonPathEntries.join(sep);
  }

  return spawnEnv;
}

const ANSI_ESCAPE_RE = /\x1b\[[0-9?]*[ -/]*[@-~]/g;
const DATASETS_DOWNLOAD_RE =
  /Downloading:\s+(?<file>\S+)\s+(?<loaded>[\d.]+(?:MB|GB|KB|B))\s+(?<speed>[\d.]+(?:kB|MB|GB|B)\/s)/i;

let lastDownloadLogSignature = "";

function resetBuffers() {
  stdoutBuffer = "";
  stderrBuffer = "";
  lastDownloadLogSignature = "";
}

function sanitizeBackendLogLine(line: string): string | null {
  const cleaned = line.replace(ANSI_ESCAPE_RE, "").replace(/\r/g, "").trim();
  if (!cleaned) {
    return null;
  }

  const downloadMatch = cleaned.match(DATASETS_DOWNLOAD_RE);
  if (downloadMatch?.groups) {
    const { file, loaded, speed } = downloadMatch.groups;
    const fileName = file.split(/[/\\]/).pop() ?? file;
    const signature = `${fileName}|${loaded}|${speed}`;
    if (signature === lastDownloadLogSignature) {
      return null;
    }
    lastDownloadLogSignature = signature;
    return `Downloading ${fileName} · ${loaded} · ${speed}`;
  }

  lastDownloadLogSignature = "";
  return cleaned;
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
    const sanitized = sanitizeBackendLogLine(line);
    if (sanitized) {
      appendBackendLog(sanitized);
    }
  }
}

function flushBufferedOutput(stream: "stdout" | "stderr") {
  const buffer = getBuffer(stream);
  const sanitized = sanitizeBackendLogLine(buffer);
  if (sanitized) {
    appendBackendLog(sanitized);
  }
  setBuffer(stream, "");
}

export function getBackendState(): BackendState {
  return {
    isRunning: backendProcess !== null || backendOwnership === "attached",
    pid: backendProcess?.pid ?? null,
    ownership: backendOwnership,
  };
}

export async function getBackendStateAsync(): Promise<BackendState> {
  const state = getBackendState();
  if (state.isRunning) {
    return state;
  }

  if (await isBackendHealthy()) {
    backendOwnership = "attached";
    return {
      isRunning: true,
      pid: null,
      ownership: "attached",
    };
  }

  return state;
}

export function getBackendLogs() {
  return backendLogs;
}

export function clearBackendLogs() {
  resetBackendLogs();
}

async function isBackendHealthy() {
  try {
    const response = await fetch(BACKEND_HEALTHCHECK_URL, {
      signal: AbortSignal.timeout(1200),
    });

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as { status?: unknown };
    return typeof payload.status === "string";
  } catch {
    return false;
  }
}

export async function startBackendProcess(): Promise<BackendStartResult> {
  const currentState = getBackendState();
  if (currentState.isRunning) {
    appendBackendLog(
      `[system] Backend process already running${currentState.pid ? ` (PID ${currentState.pid})` : ""}`,
    );
    return {
      alreadyRunning: true,
      pid: currentState.pid,
      ownership: currentState.ownership === "attached" ? "attached" : "managed",
    };
  }

  if (await isBackendHealthy()) {
    backendOwnership = "attached";
    appendBackendLog("[system] Attached to externally running backend.");
    broadcastBackendEvent({
      type: "attached",
      pid: null,
    });
    return {
      alreadyRunning: true,
      pid: null,
      ownership: "attached",
    };
  }

  resetBackendLogs();

  if (!is.dev && usesWslBackend() && (await ensureProductionEnvReady())) {
    appendBackendLog("[system] Checking WSL analysis environment…");
    try {
      await ensureWslCondaRuntime((message) => appendBackendLog(`[system] ${message}`));
      await bootstrapRtMetaDistro();
    } catch (error) {
      appendBackendLog(
        `[system] Failed to prepare WSL environment: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  const cwd = resolveBackendCwd();
  const { cmd, args } = await getBackendSpawnArgs(cwd);
  usingWslSpawn = await usesWslSpawnMode();

  appendBackendLog(
    usingWslSpawn
      ? is.dev
        ? `[system] Starting backend in WSL (dev: ${cwd})`
        : `[system] Starting backend in WSL (~/${WSL_BACKEND_DIR})`
      : `[system] Starting backend from: ${cwd}`,
  );
  appendBackendLog(`[system] Command: ${cmd} ${args.join(" ")}`);

  const spawnEnv = await buildBackendSpawnEnv(cwd);

  const child = spawn(cmd, args, {
    cwd: usingWslSpawn ? undefined : cwd,
    detached: process.platform !== "win32" && !usingWslSpawn,
    env: spawnEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  resetBuffers();
  backendProcess = child;
  backendOwnership = "managed";
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
      backendOwnership = null;
      usingWslSpawn = false;
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
    ownership: "managed",
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function stopBackendProcess() {
  const wslRuntimeAvailable =
    usesWslBackend() || (await isWslDevBackendAvailable());

  if (backendOwnership === "attached") {
    if (wslRuntimeAvailable) {
      appendBackendLog("[system] Stopping WSL backend…");
      await runWslBash("pkill -f 'uvicorn main:app' || true");
    } else {
      appendBackendLog(
        "[system] Detached from externally managed backend. Process was not stopped.",
      );
    }

    backendOwnership = null;
    broadcastBackendEvent({
      type: "exit",
      code: null,
      signal: null,
    });
    return;
  }

  const child = backendProcess;
  if (!child?.pid) {
    backendProcess = null;
    backendOwnership = null;
    usingWslSpawn = false;
    return;
  }

  appendBackendLog("[system] Stopping backend...");

  if (usingWslSpawn) {
    await runWslBash("pkill -f 'uvicorn main:app' || true");
  }

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

  backendProcess = null;
  backendOwnership = null;
  usingWslSpawn = false;
}

export function registerBackendIpcHandlers() {
  ipcMain.removeHandler("backend:start");
  ipcMain.removeHandler("backend:stop");
  ipcMain.removeHandler("backend:state");
  ipcMain.removeHandler("backend:logs");
  ipcMain.removeHandler("backend:clearLogs");

  ipcMain.handle("backend:start", async () => {
    try {
      return await startBackendProcess();
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
    return getBackendStateAsync();
  });

  ipcMain.handle("backend:logs", async () => {
    return getBackendLogs();
  });

  ipcMain.handle("backend:clearLogs", async () => {
    clearBackendLogs();
  });
}
