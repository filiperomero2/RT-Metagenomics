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

const execFileAsync = promisify(execFile);

const UNPACK_MARKER = ".rt-meta-ready";
const isWindows = process.platform === "win32";

export function getCondaEnvDir(): string {
  return join(app.getPath("userData"), "conda-env");
}

/**
 * Read the version recorded in the marker file, or `null` when the
 * environment has never been unpacked.
 */
function getInstalledEnvVersion(): string | null {
  const markerPath = join(getCondaEnvDir(), UNPACK_MARKER);
  if (!existsSync(markerPath)) return null;

  try {
    const raw = readFileSync(markerPath, "utf-8").trim();
    // Marker format (v2): first line is the app version.
    // Legacy markers (v1) only contained a date – treat those as outdated.
    const firstLine = raw.split("\n")[0];
    // A semver-ish string starts with a digit; an ISO date starts with a digit
    // too, but always contains "T" or "-" after position 4.
    if (/^\d+\.\d+/.test(firstLine)) return firstLine;
    return null;
  } catch {
    return null;
  }
}

/**
 * The environment is ready when its marker version matches the running app.
 */
export function isEnvReady(): boolean {
  return getInstalledEnvVersion() === app.getVersion();
}

/**
 * Return the full path to a binary inside the unpacked conda env.
 * On Windows conda puts scripts in `Scripts/` with `.exe` extension;
 * on Linux/macOS they live in `bin/`.
 */
export function getEnvBin(binary: string): string {
  if (isWindows) {
    return join(getCondaEnvDir(), "Scripts", `${binary}.exe`);
  }
  return join(getCondaEnvDir(), "bin", binary);
}

function getCondaUnpackPath(): string {
  if (isWindows) {
    return join(getCondaEnvDir(), "Scripts", "conda-unpack.exe");
  }
  return join(getCondaEnvDir(), "bin", "conda-unpack");
}

export async function setupCondaEnv(
  onProgress: (message: string) => void,
): Promise<void> {
  if (isEnvReady()) return;

  const tarball = join(process.resourcesPath, "conda-env.tar.gz");
  if (!existsSync(tarball)) {
    throw new Error(
      `Bundled conda environment not found at: ${tarball}\n` +
        `Run the build script before packaging the app.`,
    );
  }

  const envDir = getCondaEnvDir();

  // Remove a stale environment left by a previous version.
  if (existsSync(envDir)) {
    const oldVersion = getInstalledEnvVersion();
    onProgress(
      oldVersion
        ? `Removing outdated environment (${oldVersion})…`
        : "Removing previous environment…",
    );
    rmSync(envDir, { recursive: true, force: true });
  }

  mkdirSync(envDir, { recursive: true });

  // `tar` is available on Windows 10+, macOS, and Linux
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

  // conda-unpack rewrites hardcoded prefix paths inside the environment
  onProgress("Configuring environment paths…");
  await execFileAsync(getCondaUnpackPath());

  writeFileSync(
    join(envDir, UNPACK_MARKER),
    `${app.getVersion()}\n${new Date().toISOString()}\n`,
  );
  onProgress("Environment ready!");
}
