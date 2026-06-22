import { app } from "electron";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { get } from "node:https";
import {
  RT_META_DISTRO,
  canRunCommandsInDistro,
  clearWslAvailabilityCache,
  getWslDistroList,
  importRtMetaDistro,
  installWslPlatform,
  isDistroRegistered,
  isWslPlatformInstalled,
  runElevatedWslInstall,
} from "./wsl";

const SETUP_STATE_FILE = "wsl-setup-state.json";

const UBUNTU_ROOTFS_URL =
  "https://cloud-images.ubuntu.com/wsl/releases/22.04/current/ubuntu-jammy-wsl-amd64-wsl.rootfs.tar.gz";

export type SetupPromptResult = "continue" | "cancel" | "reboot";

export type SetupPromptHandler = (options: {
  title: string;
  message: string;
  detail?: string;
  buttons: string[];
  defaultId?: number;
  cancelId?: number;
}) => Promise<SetupPromptResult>;

type SetupState = {
  wslPlatformRequested?: boolean;
  pendingReboot?: boolean;
};

type SetupCallbacks = {
  onProgress: (message: string) => void;
  onStep: (
    step: SetupStepId,
    state: "pending" | "active" | "done" | "error",
  ) => void;
  prompt: SetupPromptHandler;
};

export type SetupStepId = "wsl" | "distro" | "conda";

function getSetupStatePath(): string {
  return join(app.getPath("userData"), SETUP_STATE_FILE);
}

function readSetupState(): SetupState {
  const path = getSetupStatePath();
  if (!existsSync(path)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(path, "utf-8")) as SetupState;
  } catch {
    return {};
  }
}

function writeSetupState(state: SetupState): void {
  writeFileSync(getSetupStatePath(), JSON.stringify(state, null, 2), "utf-8");
}

function clearSetupState(): void {
  writeSetupState({});
}

async function downloadUbuntuRootfs(
  destination: string,
  onProgress: (message: string) => void,
): Promise<void> {
  if (existsSync(destination)) {
    onProgress("Using cached Ubuntu root filesystem…");
    return;
  }

  mkdirSync(dirname(destination), { recursive: true });
  onProgress("Downloading Ubuntu base image for WSL (one-time, ~350 MB)…");

  await new Promise<void>((resolve, reject) => {
    const request = get(UBUNTU_ROOTFS_URL, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        get(response.headers.location, (redirectResponse) => {
          if (redirectResponse.statusCode !== 200) {
            reject(
              new Error(
                `Download failed with status ${redirectResponse.statusCode ?? "unknown"}`,
              ),
            );
            return;
          }

          const total = Number(redirectResponse.headers["content-length"] ?? 0);
          let downloaded = 0;
          redirectResponse.on("data", (chunk: Buffer) => {
            downloaded += chunk.length;
            if (total > 0) {
              const pct = Math.round((downloaded / total) * 100);
              onProgress(`Downloading Ubuntu base image… ${pct}%`);
            }
          });

          pipeline(redirectResponse, createWriteStream(destination))
            .then(() => resolve())
            .catch(reject);
        }).on("error", reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(
          new Error(
            `Download failed with status ${response.statusCode ?? "unknown"}`,
          ),
        );
        return;
      }

      pipeline(response, createWriteStream(destination))
        .then(() => resolve())
        .catch(reject);
    });

    request.on("error", reject);
  });
}

async function ensureWslPlatform(
  callbacks: SetupCallbacks,
  state: SetupState,
): Promise<SetupState> {
  callbacks.onStep("wsl", "active");

  if (await isWslPlatformInstalled()) {
    callbacks.onProgress("WSL2 platform is ready.");
    callbacks.onStep("wsl", "done");
    return { ...state, pendingReboot: false, wslPlatformRequested: true };
  }

  if (state.pendingReboot) {
    callbacks.onProgress(
      "Waiting for reboot to finish WSL installation…",
    );
    callbacks.onStep("wsl", "active");

    const action = await callbacks.prompt({
      title: "Restart Required",
      message:
        "WSL2 was installed but Windows needs a restart before setup can continue.",
      detail:
        "Save your work, then restart your computer and open RT-Metagenomics again.",
      buttons: ["Restart Now", "Quit"],
      defaultId: 0,
      cancelId: 1,
    });

    if (action === "reboot") {
      throw new Error("__REBOOT_REQUESTED__");
    }

    throw new Error("Setup cancelled. Restart Windows to continue WSL installation.");
  }

  const consent = await callbacks.prompt({
    title: "Install WSL2",
    message:
      "RT-Metagenomics needs WSL2 to run the metagenomics pipeline on Windows.",
    detail:
      "Administrator approval is required. Windows may ask you to restart after enabling WSL.",
    buttons: ["Install WSL2", "Cancel"],
    defaultId: 0,
    cancelId: 1,
  });

  if (consent !== "continue") {
    throw new Error("WSL2 installation was cancelled.");
  }

  callbacks.onProgress("Installing WSL2 platform (administrator approval required)…");
  const installResult = await runElevatedWslInstall();

  if (installResult === "cancelled") {
    throw new Error(
      "Administrator approval was denied. WSL2 is required to continue setup.",
    );
  }

  if (installResult === "reboot_required" || !(await isWslPlatformInstalled())) {
    writeSetupState({
      wslPlatformRequested: true,
      pendingReboot: true,
    });
    clearWslAvailabilityCache();

    const action = await callbacks.prompt({
      title: "Restart Required",
      message: "WSL2 installation started. Windows must restart to continue.",
      detail:
        "After restarting, launch RT-Metagenomics again. Setup will continue automatically.",
      buttons: ["Restart Now", "Quit"],
      defaultId: 0,
      cancelId: 1,
    });

    if (action === "reboot") {
      throw new Error("__REBOOT_REQUESTED__");
    }

    throw new Error(
      "Restart Windows to finish WSL2 installation, then launch RT-Metagenomics again.",
    );
  }

  callbacks.onProgress("WSL2 platform installed.");
  callbacks.onStep("wsl", "done");
  return { ...state, pendingReboot: false, wslPlatformRequested: true };
}

async function ensureRtMetaDistro(callbacks: SetupCallbacks): Promise<void> {
  callbacks.onStep("distro", "active");

  const distroList = await getWslDistroList();
  if (
    isDistroRegistered(RT_META_DISTRO, distroList) &&
    (await canRunCommandsInDistro())
  ) {
    callbacks.onProgress(`Linux environment "${RT_META_DISTRO}" is ready.`);
    callbacks.onStep("distro", "done");
    return;
  }

  if (!(await isWslPlatformInstalled())) {
    throw new Error(
      "WSL2 is not ready yet. Restart Windows and launch the app again.",
    );
  }

  const rootfsCacheDir = join(app.getPath("userData"), "wsl-cache");
  mkdirSync(rootfsCacheDir, { recursive: true });
  const rootfsPath = join(rootfsCacheDir, "ubuntu-jammy-wsl.rootfs.tar.gz");

  await downloadUbuntuRootfs(rootfsPath, callbacks.onProgress);
  callbacks.onProgress(`Creating dedicated Linux environment "${RT_META_DISTRO}"…`);

  await importRtMetaDistro(rootfsPath);

  if (!(await canRunCommandsInDistro())) {
    throw new Error(
      `The "${RT_META_DISTRO}" Linux environment could not be started.`,
    );
  }

  callbacks.onProgress(`Linux environment "${RT_META_DISTRO}" is ready.`);
  callbacks.onStep("distro", "done");
}

export async function isWslDistroReady(): Promise<boolean> {
  if (!(await isWslPlatformInstalled())) {
    return false;
  }

  const distroList = await getWslDistroList();
  if (!isDistroRegistered(RT_META_DISTRO, distroList)) {
    return false;
  }

  return canRunCommandsInDistro();
}

export async function runWindowsWslSetup(callbacks: SetupCallbacks): Promise<void> {
  let state = readSetupState();

  try {
    await ensureWslPlatform(callbacks, state);
    state = { ...state, pendingReboot: false };
    writeSetupState(state);

    await ensureRtMetaDistro(callbacks);
    clearSetupState();
    clearWslAvailabilityCache();
  } catch (error) {
    if (error instanceof Error && error.message === "__REBOOT_REQUESTED__") {
      throw error;
    }
    callbacks.onStep("wsl", "error");
    callbacks.onStep("distro", "error");
    throw error;
  }
}

export function requestWindowsRestart(): void {
  import("node:child_process").then(({ spawn }) => {
    spawn("shutdown.exe", ["/r", "/t", "0", "/c", "RT-Metagenomics WSL setup"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
  });
}
