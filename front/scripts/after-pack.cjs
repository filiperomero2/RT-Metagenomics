"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function runRcedit(rceditBin, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(rceditBin, args, { stdio: "inherit" });
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`rcedit exited with code ${code}`));
    });
  });
}

/** @param {import("app-builder-lib").AfterPackContext} context */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") {
    return;
  }

  const exeName = `${context.packager.appInfo.productFilename}.exe`;
  const exePath = path.join(context.appOutDir, exeName);
  const iconPath = path.join(context.packager.projectDir, "src/renderer/public/logo.ico");
  const rceditBin = path.join(
    context.packager.projectDir,
    "node_modules/rcedit/bin/rcedit-x64.exe",
  );

  if (!fs.existsSync(exePath)) {
    throw new Error(`Executable not found for icon patch: ${exePath}`);
  }

  if (!fs.existsSync(iconPath)) {
    throw new Error(`Icon not found: ${iconPath}`);
  }

  if (!fs.existsSync(rceditBin)) {
    throw new Error(`rcedit binary not found: ${rceditBin}`);
  }

  await runRcedit(rceditBin, [exePath, "--set-icon", iconPath]);
};
