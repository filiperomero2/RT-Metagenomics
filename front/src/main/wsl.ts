import { app } from "electron";
import { execFile, spawn } from "node:child_process";
import { createReadStream, createWriteStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const RT_META_DISTRO = "rt-meta";
export const WSL_APP_DIR = ".rt-metagenomics";
export const WSL_CONDA_DIR = `${WSL_APP_DIR}/conda-env`;
export const WSL_BACKEND_DIR = `${WSL_APP_DIR}/back/app`;
export const WSL_RUNTIME_MARKER = `${WSL_APP_DIR}/.rt-meta-ready`;
export const WSL_DB_PATH = `${WSL_APP_DIR}/rtmeta.db`;

const WINDOWS_REBOOT_EXIT_CODE = 3010;
const UAC_CANCEL_EXIT_CODE = 1223;

let wslAvailabilityCache: boolean | null = null;

export function isWindowsPlatform(): boolean {
  return process.platform === "win32";
}

export function clearWslAvailabilityCache(): void {
  wslAvailabilityCache = null;
}

export function getLinuxCondaTarballPath(resourcesPath: string): string {
  return join(resourcesPath, "conda-env-linux.tar.gz");
}

export function shouldUseWslBackend(resourcesPath: string): boolean {
  return (
    isWindowsPlatform() &&
    existsSync(getLinuxCondaTarballPath(resourcesPath))
  );
}

function wslArgs(args: string[]): string[] {
  return ["-d", RT_META_DISTRO, ...args];
}

export function toWslPathSync(winPath: string): string {
  const normalized = resolve(winPath.trim());
  if (normalized.startsWith("/")) {
    return normalized;
  }

  const driveMatch = /^([A-Za-z]):[/\\]?(.*)$/.exec(normalized);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    const rest = (driveMatch[2] ?? "").replaceAll("\\", "/").replace(/\/+$/, "");
    return rest ? `/mnt/${drive}/${rest}` : `/mnt/${drive}`;
  }

  return normalized.replaceAll("\\", "/");
}

function writeUnixScript(scriptPath: string, script: string): void {
  mkdirSync(dirname(scriptPath), { recursive: true });
  const normalized = script.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  writeFileSync(scriptPath, normalized, { encoding: "utf8" });
}

export type RunWslScriptResult = {
  code: number;
  stdout: string;
  stderr: string;
};

export async function runWslBashScript(
  script: string,
  options?: {
    onStdout?: (chunk: string) => void;
    onStderr?: (chunk: string) => void;
    runAsRoot?: boolean;
  },
): Promise<RunWslScriptResult> {
  const scriptDir = join(app.getPath("userData"), "wsl-scripts");
  mkdirSync(scriptDir, { recursive: true });
  const scriptPath = join(scriptDir, `rt-meta-${Date.now()}.sh`);
  writeUnixScript(scriptPath, script);

  const wslScriptPath = toWslPathSync(scriptPath);
  const args = ["-d", RT_META_DISTRO];
  if (options?.runAsRoot !== false) {
    args.push("-u", "root");
  }
  args.push("-e", "bash", wslScriptPath);

  let stdout = "";
  let stderr = "";

  const code = await new Promise<number>((resolve, reject) => {
    const child = spawn("wsl.exe", args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      options?.onStdout?.(chunk);
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      options?.onStderr?.(chunk);
    });

    child.on("error", reject);
    child.on("exit", (exitCode) => resolve(exitCode ?? 1));
  });

  return { code, stdout, stderr };
}

export async function bootstrapRtMetaDistro(): Promise<void> {
  const result = await runWslBashScript(
    [
      "set -eu",
      "export DEBIAN_FRONTEND=noninteractive",
      "missing=",
      "for cmd in tar gzip make; do",
      "  if ! command -v \"$cmd\" >/dev/null 2>&1; then",
      "    missing=\"$missing $cmd\"",
      "  fi",
      "done",
      "if [ -n \"$missing\" ]; then",
      "  apt-get update -qq || true",
      "  apt-get install -y -qq tar gzip ca-certificates curl make",
      "fi",
      "command -v tar",
      "command -v gzip",
      "command -v make",
    ].join("\n"),
  );

  if (result.code !== 0) {
    const details = [result.stderr.trim(), result.stdout.trim()]
      .filter(Boolean)
      .join("\n");
    throw new Error(
      `Failed to prepare WSL packages (exit ${result.code}).${details ? `\n${details}` : ""}`,
    );
  }
}

export async function getWslDistroList(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("wsl.exe", ["-l", "-v"], {
      encoding: "utf8",
      windowsHide: true,
    });
    return stdout.replace(/\u0000/g, "");
  } catch (error) {
    const execError = error as NodeJS.ErrnoException & { stdout?: string };
    return (execError.stdout ?? "").replace(/\u0000/g, "");
  }
}

export function isDistroRegistered(
  distroName: string,
  distroList: string,
): boolean {
  const escaped = distroName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(distroList);
}

async function shutdownWsl(): Promise<void> {
  try {
    await execFileAsync("wsl.exe", ["--shutdown"], { windowsHide: true });
  } catch {
    // WSL may already be stopped.
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 1500);
  });
}

async function unregisterDistroSafely(distroName: string): Promise<void> {
  try {
    await execFileAsync("wsl.exe", ["--terminate", distroName], {
      windowsHide: true,
    });
  } catch {
    // Distro may already be stopped.
  }

  try {
    await execFileAsync("wsl.exe", ["--unregister", distroName], {
      windowsHide: true,
    });
    return;
  } catch {
    // Retry after shutting WSL down (distro may be locked).
  }

  await shutdownWsl();

  try {
    await execFileAsync("wsl.exe", ["--unregister", distroName], {
      windowsHide: true,
    });
  } catch {
    // If the distro is already gone, import can proceed.
  }
}

export async function isWslPlatformInstalled(): Promise<boolean> {
  if (!isWindowsPlatform()) {
    return false;
  }

  try {
    await execFileAsync("wsl.exe", ["--status"], { windowsHide: true });
    return true;
  } catch {
    const list = await getWslDistroList();
    return list.trim().length > 0;
  }
}

export async function isWslAvailable(): Promise<boolean> {
  if (!isWindowsPlatform()) {
    return false;
  }

  if (wslAvailabilityCache !== null) {
    return wslAvailabilityCache;
  }

  if (!(await isWslPlatformInstalled())) {
    wslAvailabilityCache = false;
    return false;
  }

  const list = await getWslDistroList();
  if (!isDistroRegistered(RT_META_DISTRO, list)) {
    wslAvailabilityCache = false;
    return false;
  }

  wslAvailabilityCache = await canRunCommandsInDistro();
  return wslAvailabilityCache;
}

export async function canRunCommandsInDistro(): Promise<boolean> {
  try {
    await execFileAsync(
      "wsl.exe",
      wslArgs(["-e", "bash", "-lc", "echo rt-meta-ready"]),
      { windowsHide: true, timeout: 60_000 },
    );
    return true;
  } catch {
    return false;
  }
}

export async function runElevatedWslInstall(): Promise<
  "success" | "reboot_required" | "cancelled"
> {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$args = @('--install', '--no-distribution', '--web-download')",
    "$proc = Start-Process -FilePath 'wsl.exe' -ArgumentList $args -Verb RunAs -Wait -PassThru -WindowStyle Hidden",
    "exit $proc.ExitCode",
  ].join("\n");

  const scriptPath = join(tmpdir(), `rt-meta-wsl-install-${Date.now()}.ps1`);
  writeFileSync(scriptPath, script, "utf-8");

  try {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        scriptPath,
      ],
      { windowsHide: true },
    );
    return "success";
  } catch (error) {
    const execError = error as NodeJS.ErrnoException & { code?: number | string };
    const exitCode = Number(execError.code);

    if (exitCode === UAC_CANCEL_EXIT_CODE) {
      return "cancelled";
    }

    if (exitCode === WINDOWS_REBOOT_EXIT_CODE) {
      return "reboot_required";
    }

    if (await isWslPlatformInstalled()) {
      return "success";
    }

    throw new Error(
      `WSL installation failed${exitCode ? ` (exit code ${exitCode})` : ""}.`,
    );
  } finally {
    rmSync(scriptPath, { force: true });
  }
}

export async function installWslPlatform(): Promise<void> {
  const result = await runElevatedWslInstall();
  if (result === "cancelled") {
    throw new Error("Administrator approval was denied.");
  }
}

function getRtMetaDistroInstallDir(): string {
  return join(app.getPath("userData"), "wsl-distro", RT_META_DISTRO);
}

async function resolveWslImportRootfsTar(rootfsPath: string): Promise<string> {
  if (!/\.tar\.gz$/i.test(rootfsPath)) {
    return rootfsPath;
  }

  const tarPath = rootfsPath.replace(/\.gz$/i, "");
  const minTarBytes = 100 * 1024 * 1024;

  if (existsSync(tarPath) && statSync(tarPath).size >= minTarBytes) {
    return tarPath;
  }

  await pipeline(
    createReadStream(rootfsPath),
    createGunzip(),
    createWriteStream(tarPath),
  );

  if (!existsSync(tarPath) || statSync(tarPath).size < minTarBytes) {
    rmSync(tarPath, { force: true });
    throw new Error(
      "Decompressed WSL rootfs tar is missing or too small. Retry setup.",
    );
  }

  return tarPath;
}

export async function importRtMetaDistro(rootfsPath: string): Promise<void> {
  const installDir = getRtMetaDistroInstallDir();
  mkdirSync(installDir, { recursive: true });

  const list = await getWslDistroList();
  if (isDistroRegistered(RT_META_DISTRO, list)) {
    await unregisterDistroSafely(RT_META_DISTRO);
  }

  const importTar = await resolveWslImportRootfsTar(rootfsPath);

  await execFileAsync(
    "wsl.exe",
    [
      "--import",
      RT_META_DISTRO,
      installDir,
      importTar,
      "--version",
      "2",
    ],
    { windowsHide: true, timeout: 600_000 },
  );

  clearWslAvailabilityCache();
  await bootstrapRtMetaDistro();
}

export async function runWslBash(
  script: string,
  options?: { onStdout?: (chunk: string) => void; onStderr?: (chunk: string) => void },
): Promise<number> {
  const result = await runWslBashScript(script, options);
  return result.code;
}

export async function getWslInstalledEnvVersion(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "wsl.exe",
      wslArgs([
        "-e",
        "bash",
        "-lc",
        `head -1 ~/${WSL_RUNTIME_MARKER} 2>/dev/null || true`,
      ]),
      { encoding: "utf8", windowsHide: true },
    );
    const firstLine = stdout.trim().split("\n")[0]?.trim() ?? "";
    return /^\d+\.\d+/.test(firstLine) ? firstLine : null;
  } catch {
    return null;
  }
}

export function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export function getWslBashLcArgs(script: string): string[] {
  return ["-d", RT_META_DISTRO, "-u", "root", "-e", "bash", "-lc", script];
}

export function buildWslDevBackendLaunchScript(options: {
  backendCwd: string;
  appVersion: string;
}): string {
  const wslCwd = toWslPathSync(options.backendCwd);
  const envDir = `$HOME/${WSL_CONDA_DIR}`;

  return [
    `mkdir -p "$HOME/${WSL_APP_DIR}"`,
    `test -f ${shellQuote(`${wslCwd}/main.py`)}`,
    `cd ${shellQuote(wslCwd)}`,
    `export RT_META_WSL=1`,
    `export RT_META_WSL_DISTRO=${shellQuote(RT_META_DISTRO)}`,
    `export RT_META_APP_VERSION=${shellQuote(options.appVersion)}`,
    `export RT_META_DEV=1`,
    `export DATABASE_URL=sqlite:///$HOME/${WSL_DB_PATH}`,
    `export PYTHONPATH=${shellQuote(`${wslCwd}/viralunity`)}`,
    `export CONDA_PREFIX="${envDir}"`,
    `export CONDA_DEFAULT_ENV=rt-meta`,
    `export PATH="${envDir}/bin:$PATH"`,
    `PYTHON="${envDir}/bin/python"`,
    `[ -x "$PYTHON" ] || PYTHON="${envDir}/bin/python3"`,
    `test -x "$PYTHON"`,
    `exec "$PYTHON" -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level debug`,
  ].join(" && ");
}

export function buildWslBackendLaunchScript(options: {
  appVersion: string;
}): string {
  const backendDir = `$HOME/${WSL_BACKEND_DIR}`;
  const envDir = `$HOME/${WSL_CONDA_DIR}`;

  return [
    `mkdir -p "$HOME/${WSL_APP_DIR}"`,
    `test -f "${backendDir}/main.py"`,
    `cd "${backendDir}"`,
    `export RT_META_WSL=1`,
    `export RT_META_WSL_DISTRO=${shellQuote(RT_META_DISTRO)}`,
    `export RT_META_APP_VERSION=${shellQuote(options.appVersion)}`,
    `export DATABASE_URL=sqlite:///$HOME/${WSL_DB_PATH}`,
    `export PYTHONPATH="${backendDir}/viralunity"`,
    `export CONDA_PREFIX="${envDir}"`,
    `export CONDA_DEFAULT_ENV=rt-meta`,
    `export PATH="${envDir}/bin:$PATH"`,
    `PYTHON="${envDir}/bin/python"`,
    `[ -x "$PYTHON" ] || PYTHON="${envDir}/bin/python3"`,
    `test -x "$PYTHON"`,
    `exec "$PYTHON" -m uvicorn main:app --host 127.0.0.1 --port 8000 --log-level info`,
  ].join(" && ");
}

export function getWslSetupInstructions(): string {
  return [
    "WSL2 is required to run the metagenomics pipeline on Windows.",
    "",
    "Launch RT-Metagenomics again and follow the setup wizard, or install manually:",
    "  wsl --install --no-distribution",
    "",
    "Restart your computer if prompted, then reopen the app.",
  ].join("\n");
}
