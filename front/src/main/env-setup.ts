import { app } from "electron";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { execFile, spawn } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";
import {
  isWslCondaEnvironmentReady,
  setupWslRuntime,
} from "./wsl-conda-env";
import {
  getLinuxCondaTarballPath,
  isWindowsPlatform,
  shouldUseWslBackend,
  WSL_CONDA_DIR,
} from "./wsl";

const execFileAsync = promisify(execFile);

const UNPACK_MARKER = ".rt-meta-ready";
const isWindows = isWindowsPlatform();

export function usesWslBackend(): boolean {
  return shouldUseWslBackend(process.resourcesPath);
}

export function getCondaEnvDir(): string {
  if (usesWslBackend()) {
    return join(app.getPath("userData"), "wsl-conda-env");
  }
  return join(app.getPath("userData"), "conda-env");
}

function getNativeInstalledEnvVersion(): string | null {
  const markerPath = join(getCondaEnvDir(), UNPACK_MARKER);
  if (!existsSync(markerPath)) return null;

  try {
    const raw = readFileSync(markerPath, "utf-8").trim();
    const firstLine = raw.split("\n")[0];
    if (/^\d+\.\d+/.test(firstLine)) return firstLine;
    return null;
  } catch {
    return null;
  }
}

export function isEnvReady(): boolean {
  if (usesWslBackend()) {
    return false;
  }
  return getNativeInstalledEnvVersion() === app.getVersion();
}

export async function isEnvReadyAsync(): Promise<boolean> {
  if (usesWslBackend()) {
    return isWslCondaEnvironmentReady();
  }
  return getNativeInstalledEnvVersion() === app.getVersion();
}

export function getEnvBin(binary: string): string {
  if (usesWslBackend()) {
    return `~/${WSL_CONDA_DIR}/bin/${binary}`;
  }

  if (isWindows) {
    return join(getCondaEnvDir(), "Scripts", `${binary}.exe`);
  }
  return join(getCondaEnvDir(), "bin", binary);
}

function getNativeCondaUnpackPath(): string {
  if (isWindows) {
    return join(getCondaEnvDir(), "Scripts", "conda-unpack.exe");
  }
  return join(getCondaEnvDir(), "bin", "conda-unpack");
}

function getBundledCondaTarball(): string {
  if (usesWslBackend()) {
    return getLinuxCondaTarballPath(process.resourcesPath);
  }
  return join(process.resourcesPath, "conda-env.tar.gz");
}

function getBundledBackendPath(): string {
  return join(process.resourcesPath, "back", "app");
}

async function setupNativeCondaEnv(
  onProgress: (message: string) => void,
): Promise<void> {
  const tarball = getBundledCondaTarball();
  if (!existsSync(tarball)) {
    throw new Error(
      `Bundled conda environment not found at: ${tarball}\n` +
        `Run the build script before packaging the app.`,
    );
  }

  const envDir = getCondaEnvDir();

  if (existsSync(envDir)) {
    const oldVersion = getNativeInstalledEnvVersion();
    onProgress(
      oldVersion
        ? `Removing outdated environment (${oldVersion})…`
        : "Removing previous environment…",
    );
    rmSync(envDir, { recursive: true, force: true });
  }

  mkdirSync(envDir, { recursive: true });

  onProgress("Extracting environment (this may take a few minutes)…");
  await new Promise<void>((resolve, reject) => {
    const tar = spawn("tar", ["-xzf", tarball, "-C", envDir], {
      stdio: "pipe",
    });
    tar.on("error", reject);
    tar.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`tar exited with code ${code}`));
    });
  });

  onProgress("Configuring environment paths…");
  await execFileAsync(getNativeCondaUnpackPath());

  writeFileSync(
    join(envDir, UNPACK_MARKER),
    `${app.getVersion()}\n${new Date().toISOString()}\n`,
  );
}

async function setupWslCondaEnv(
  onProgress: (message: string) => void,
): Promise<void> {
  const tarball = getBundledCondaTarball();
  if (!existsSync(tarball)) {
    throw new Error(
      `Linux conda environment not found at: ${tarball}\n` +
        `Rebuild the Windows installer with a Linux conda pack artifact.`,
    );
  }

  const backend = getBundledBackendPath();
  if (!existsSync(backend)) {
    throw new Error(
      `Backend application not found at: ${backend}\n` +
        `Rebuild the Windows installer with bundled backend resources.`,
    );
  }

  if (await isWslCondaEnvironmentReady()) {
    onProgress("Analysis environment already configured in WSL.");
    return;
  }

  await setupWslRuntime(tarball, backend, onProgress);
}

export async function setupCondaEnv(
  onProgress: (message: string) => void,
): Promise<void> {
  if (await isEnvReadyAsync()) {
    return;
  }

  if (usesWslBackend()) {
    await setupWslCondaEnv(onProgress);
    onProgress("Analysis tools ready!");
    return;
  }

  await setupNativeCondaEnv(onProgress);
  onProgress("Environment ready!");
}

export async function ensureWslCondaRuntime(
  onProgress?: (message: string) => void,
): Promise<void> {
  if (!usesWslBackend()) {
    return;
  }

  if (await isWslCondaEnvironmentReady()) {
    return;
  }

  onProgress?.("Repairing WSL analysis environment…");
  await setupWslCondaEnv((message) => onProgress?.(message));
}
