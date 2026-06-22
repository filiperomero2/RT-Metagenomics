import { dialog } from "electron";
import {
  isEnvReadyAsync,
  setupCondaEnv,
  usesWslBackend,
} from "./env-setup";
import {
  closeSetupWindow,
  createSetupWindow,
  markSetupStepsCompleteThrough,
  updateSetupStatus,
  updateSetupStep,
} from "./setup-window";
import {
  isWslDistroReady,
  requestWindowsRestart,
  runWindowsWslSetup,
  type SetupPromptHandler,
  type SetupPromptResult,
} from "./wsl-setup";

export type FirstRunSetupResult = "complete" | "reboot";

function createSetupPromptHandler(
  onRebootRequested: () => void,
): SetupPromptHandler {
  return async ({ title, message, detail, buttons, defaultId = 0, cancelId = 1 }) => {
    const result = await dialog.showMessageBox({
      type: "question",
      title,
      message,
      detail,
      buttons,
      defaultId,
      cancelId,
      noLink: true,
    });

    if (result.response === 0 && buttons[0]?.toLowerCase().includes("restart")) {
      onRebootRequested();
      return "reboot" satisfies SetupPromptResult;
    }

    if (result.response === cancelId) {
      return "cancel" satisfies SetupPromptResult;
    }

    return "continue" satisfies SetupPromptResult;
  };
}

export async function isFirstRunSetupComplete(): Promise<boolean> {
  if (usesWslBackend() && !(await isWslDistroReady())) {
    return false;
  }

  return isEnvReadyAsync();
}

export async function runFirstRunSetup(): Promise<FirstRunSetupResult> {
  createSetupWindow();
  updateSetupStep("wsl", "pending");
  updateSetupStep("distro", "pending");
  updateSetupStep("conda", "pending");

  let rebootRequested = false;
  const prompt = createSetupPromptHandler(() => {
    rebootRequested = true;
  });

  try {
    if (usesWslBackend()) {
      if (await isWslDistroReady()) {
        markSetupStepsCompleteThrough("distro");
        updateSetupStatus("WSL2 environment already configured.");
      } else {
        try {
          await runWindowsWslSetup({
            onProgress: updateSetupStatus,
            onStep: updateSetupStep,
            prompt,
          });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "__REBOOT_REQUESTED__"
          ) {
            rebootRequested = true;
          } else {
            throw error;
          }
        }
      }
    }

    if (rebootRequested) {
      closeSetupWindow();
      requestWindowsRestart();
      return "reboot";
    }

    if (!(await isEnvReadyAsync())) {
      updateSetupStep("conda", "active");
      await setupCondaEnv((message) => {
        updateSetupStatus(message);
        if (message.toLowerCase().includes("ready")) {
          updateSetupStep("conda", "done");
        }
      });
      updateSetupStep("conda", "done");
      updateSetupStatus("Setup complete!");
    } else {
      updateSetupStep("conda", "done");
      updateSetupStatus("Analysis tools already installed.");
    }

    closeSetupWindow();
    return "complete";
  } catch (error) {
    if (rebootRequested) {
      closeSetupWindow();
      requestWindowsRestart();
      return "reboot";
    }

    throw error;
  }
}
