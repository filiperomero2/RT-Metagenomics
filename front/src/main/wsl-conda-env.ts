import { app } from "electron";
import {
  bootstrapRtMetaDistro,
  getWslInstalledEnvVersion,
  isWslAvailable,
  runWslBashScript,
  shellQuote,
  toWslPathSync,
  WSL_BACKEND_DIR,
  WSL_CONDA_DIR,
  WSL_APP_DIR,
  WSL_RUNTIME_MARKER,
  isWindowsPlatform,
  toWslPathSync,
} from "./wsl";
import { isWslDistroReady } from "./wsl-setup";

const WSL_CONDA_VALIDATE_MODULES = [
  "uvicorn",
  "fastapi",
  "sqlmodel",
  "pydantic",
  "dotenv",
] as const;

function buildWslCondaPythonPathScript(): string[] {
  return [
    `ENV_DIR="$HOME/${WSL_CONDA_DIR}"`,
    `PYTHON="$ENV_DIR/bin/python"`,
    `[ -x "$PYTHON" ] || PYTHON="$ENV_DIR/bin/python3"`,
    `test -x "$PYTHON"`,
  ];
}

export function buildWslCondaValidateScript(): string {
  const modules = WSL_CONDA_VALIDATE_MODULES.map((name) => shellQuote(name)).join(
    ", ",
  );
  return [
    "#!/bin/bash",
    "set -eu",
    ...buildWslCondaPythonPathScript(),
    `"$PYTHON" -c "import importlib; [importlib.import_module(m) for m in (${modules})]; print('ok')"`,
  ].join("\n");
}

export function buildWslBackendValidateScript(): string {
  return [
    "#!/bin/bash",
    "set -eu",
    `test -f "$HOME/${WSL_BACKEND_DIR}/main.py"`,
  ].join("\n");
}

export async function verifyWslCondaEnvironment(): Promise<boolean> {
  const result = await runWslBashScript(buildWslCondaValidateScript());
  return result.code === 0;
}

export async function verifyWslBackendDeployed(): Promise<boolean> {
  const result = await runWslBashScript(buildWslBackendValidateScript());
  return result.code === 0;
}

export function buildWslRuntimeSetupScript(options: {
  wslTarball: string;
  wslBackendSrc: string;
  version: string;
  marker: string;
}): string {
  const modules = WSL_CONDA_VALIDATE_MODULES.map((m) => shellQuote(m)).join(", ");

  return [
    "#!/bin/bash",
    "set -euo pipefail",
    `mkdir -p "$HOME/${WSL_APP_DIR}"`,
    `ENV_DIR="$HOME/${WSL_CONDA_DIR}"`,
    `rm -rf "$ENV_DIR"`,
    `mkdir -p "$ENV_DIR"`,
    `echo "Extracting conda environment..."`,
    `tar -xzf ${shellQuote(options.wslTarball)} -C "$ENV_DIR"`,
    `PYTHON="$ENV_DIR/bin/python"`,
    `[ -x "$PYTHON" ] || PYTHON="$ENV_DIR/bin/python3"`,
    `test -x "$PYTHON"`,
    `test -f "$ENV_DIR/bin/conda-unpack"`,
    `echo "Running conda-unpack..."`,
    `"$PYTHON" "$ENV_DIR/bin/conda-unpack"`,
    `echo "Validating conda environment..."`,
    `"$PYTHON" -c "import importlib; [importlib.import_module(m) for m in (${modules})]"`,
    `echo "Deploying backend into WSL..."`,
    `BACKEND_DEST="$HOME/${WSL_BACKEND_DIR}"`,
    `rm -rf "$BACKEND_DEST"`,
    `mkdir -p "$BACKEND_DEST"`,
    `( cd ${shellQuote(options.wslBackendSrc)} && tar cf - . ) | ( cd "$BACKEND_DEST" && tar xf - )`,
    `test -f "$BACKEND_DEST/main.py"`,
    `printf '%s\\n%s\\n' ${shellQuote(options.version)} ${shellQuote(options.marker)} > "$HOME/${WSL_RUNTIME_MARKER}"`,
    `echo "WSL runtime ready."`,
  ].join("\n");
}

export async function setupWslRuntime(
  tarball: string,
  backendSrc: string,
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

  onProgress("Preparing WSL Linux distro…");
  await bootstrapRtMetaDistro();

  const wslTarball = toWslPathSync(tarball);
  const wslBackendSrc = toWslPathSync(backendSrc);
  const version = app.getVersion();
  const marker = new Date().toISOString();

  onProgress("Installing analysis tools and backend inside WSL…");
  const result = await runWslBashScript(
    buildWslRuntimeSetupScript({ wslTarball, wslBackendSrc, version, marker }),
  );

  if (result.code !== 0) {
    const details = [result.stderr.trim(), result.stdout.trim()]
      .filter(Boolean)
      .join("\n");
    throw new Error(
      [
        `WSL runtime setup failed (exit ${result.code}).`,
        details,
        "",
        "The bundled Linux conda pack may be outdated or incomplete.",
        "Rebuild it with: .\\build.ps1 -PackLinuxConda",
      ].join("\n"),
    );
  }
}

/** @deprecated Use setupWslRuntime */
export const extractWslCondaEnvironment = setupWslRuntime;

export async function isWslDevBackendAvailable(): Promise<boolean> {
  if (!isWindowsPlatform()) {
    return false;
  }
  if (!(await isWslAvailable())) {
    return false;
  }

  const result = await runWslBashScript(
    [
      "set -eu",
      `test -x "$HOME/${WSL_CONDA_DIR}/bin/python" || test -x "$HOME/${WSL_CONDA_DIR}/bin/python3"`,
    ].join("\n"),
  );
  return result.code === 0;
}

export async function isWslCondaEnvironmentReady(): Promise<boolean> {
  const version = await getWslInstalledEnvVersion();
  if (version !== app.getVersion()) {
    return false;
  }
  if (!(await verifyWslBackendDeployed())) {
    return false;
  }
  return verifyWslCondaEnvironment();
}
