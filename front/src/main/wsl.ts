import { app } from "electron";
import { execFile, spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export const RT_META_DISTRO = "rt-meta";
export const WSL_APP_DIR = ".rt-metagenomics";
export const WSL_CONDA_DIR = `${WSL_APP_DIR}/conda-env`;
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
  return distroList.toLowerCase().includes(distroName.toLowerCase());
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

export async function importRtMetaDistro(rootfsPath: string): Promise<void> {
  const installDir = getRtMetaDistroInstallDir();
  mkdirSync(installDir, { recursive: true });

  const list = await getWslDistroList();
  if (isDistroRegistered(RT_META_DISTRO, list)) {
    try {
      await execFileAsync("wsl.exe", ["--terminate", RT_META_DISTRO], {
        windowsHide: true,
      });
    } catch {
      // Distro may already be stopped.
    }

    await execFileAsync("wsl.exe", ["--unregister", RT_META_DISTRO], {
      windowsHide: true,
    });
  }

  await execFileAsync(
    "wsl.exe",
    [
      "--import",
      RT_META_DISTRO,
      installDir,
      rootfsPath,
      "--version",
      "2",
    ],
    { windowsHide: true, timeout: 600_000 },
  );

  await execFileAsync(
    "wsl.exe",
    wslArgs([
      "-u",
      "root",
      "-e",
      "bash",
      "-lc",
      "mkdir -p /root/.rt-metagenomics && echo rt-meta > /etc/rt-meta-distro",
    ]),
    { windowsHide: true, timeout: 60_000 },
  );
}

export async function windowsToWslPath(winPath: string): Promise<string> {
  const normalized = winPath.trim();
  if (!normalized) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return normalized;
  }

  if (await canRunCommandsInDistro()) {
    try {
      const { stdout } = await execFileAsync(
        "wsl.exe",
        wslArgs(["wslpath", "-a", normalized]),
        { encoding: "utf8", windowsHide: true },
      );
      const converted = stdout.trim();
      if (converted) {
        return converted;
      }
    } catch {
      // Fall back to manual conversion below.
    }
  }

  const driveMatch = /^([A-Za-z]):[/\\]?(.*)$/.exec(normalized);
  if (driveMatch) {
    const drive = driveMatch[1].toLowerCase();
    const rest = (driveMatch[2] ?? "").replaceAll("\\", "/").replace(/\/+$/, "");
    return rest ? `/mnt/${drive}/${rest}` : `/mnt/${drive}`;
  }

  return normalized.replaceAll("\\", "/");
}

export async function runWslBash(
  script: string,
  options?: { onStdout?: (chunk: string) => void; onStderr?: (chunk: string) => void },
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "wsl.exe",
      wslArgs(["-e", "bash", "-lc", script]),
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      },
    );

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      options?.onStdout?.(chunk);
    });

    child.stderr.on("data", (chunk: string) => {
      options?.onStderr?.(chunk);
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

export async function getWslInstalledEnvVersion(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "wsl.exe",
      wslArgs([
        "-e",
        "bash",
        "-lc",
        `head -1 ~/${WSL_CONDA_DIR}/.rt-meta-ready 2>/dev/null || true`,
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

export async function buildWslBackendLaunchScript(options: {
  backendCwd: string;
  appVersion: string;
}): Promise<string> {
  const wslCwd = await windowsToWslPath(options.backendCwd);

  return [
    `mkdir -p "$HOME/${WSL_APP_DIR}"`,
    `cd ${shellQuote(wslCwd)}`,
    `export RT_META_WSL=1`,
    `export RT_META_WSL_DISTRO=${shellQuote(RT_META_DISTRO)}`,
    `export RT_META_APP_VERSION=${shellQuote(options.appVersion)}`,
    `export DATABASE_URL=sqlite:///$HOME/${WSL_DB_PATH}`,
    `export PYTHONPATH=${shellQuote(`${wslCwd}/viralunity`)}`,
    `export PATH="$HOME/${WSL_CONDA_DIR}/bin:$PATH"`,
    `exec "$HOME/${WSL_CONDA_DIR}/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 --log-level info`,
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
