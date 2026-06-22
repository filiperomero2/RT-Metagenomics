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
  getLinuxCondaTarballPath,
  getWslInstalledEnvVersion,
  isWslAvailable,
  isWindowsPlatform,
  runWslBash,
  shellQuote,
  shouldUseWslBackend,
  WSL_CONDA_DIR,
  windowsToWslPath,
} from "./wsl";
import { isWslDistroReady } from "./wsl-setup";

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
    const version = await getWslInstalledEnvVersion();
    return version === app.getVersion();
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
  if (!(await isWslDistroReady())) {
    throw new Error(
      "WSL2 Linux environment is not ready. Complete the setup wizard first.",
    );
  }

  if (!(await isWslAvailable())) {
    throw new Error(
      "WSL2 Linux environment is not responding. Restart the app and try again.",
    );
  }

  const tarball = getBundledCondaTarball();
  if (!existsSync(tarball)) {
    throw new Error(
      `Linux conda environment not found at: ${tarball}\n` +
        `Rebuild the Windows installer with a Linux conda pack artifact.`,
    );
  }

  const installedVersion = await getWslInstalledEnvVersion();
  if (installedVersion === app.getVersion()) {
    onProgress("Linux environment already configured in WSL.");
    return;
  }

  onProgress("Preparing WSL environment…");
  const wslTarball = await windowsToWslPath(tarball);
  const version = app.getVersion();
  const marker = `${new Date().toISOString()}`;

  const setupScript = [
    `set -euo pipefail`,
    `rm -rf "$HOME/${WSL_CONDA_DIR}"`,
    `mkdir -p "$HOME/${WSL_CONDA_DIR}"`,
    `tar -xzf ${shellQuote(wslTarball)} -C "$HOME/${WSL_CONDA_DIR}"`,
    `"$HOME/${WSL_CONDA_DIR}/bin/conda-unpack"`,
    `printf '%s\\n%s\\n' ${shellQuote(version)} ${shellQuote(marker)} > "$HOME/${WSL_CONDA_DIR}/.rt-meta-ready"`,
  ].join("\n");

  onProgress("Extracting Linux environment inside WSL (may take a few minutes)…");
  const exitCode = await runWslBash(setupScript);
  if (exitCode !== 0) {
    throw new Error(`WSL environment setup failed with exit code ${exitCode}`);
  }
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
