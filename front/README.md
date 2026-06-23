# RT-Metagenomics Desktop App

Electron desktop application for RT-Metagenomics. Built with **React**, **Vite**, **electron-vite**, and **Bun**.

## Prerequisites

- [Bun](https://bun.sh/)
- For development: a local `rt-meta` Conda environment with the backend dependencies (see [../back/README.md](../back/README.md))
- For Windows packaging: `front/resources/conda-env-linux.tar.gz` (Linux Conda pack for WSL)

## Development

```bash
cd front
bun install
bun run dev
```

This starts the Electron app in development mode with hot reload. The backend is spawned via the local `rt-meta` Conda environment when you start it from the app UI.

### Other scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Development server (electron-vite) |
| `bun run prebuild` | Production build of main, preload, and renderer |
| `bun run start` | Preview the production build |
| `bun run lint` | Run ESLint |
| `bun run prettier` | Format source files |

## Architecture

```
front/
├── src/
│   ├── main/           # Electron main process
│   │   ├── wsl.ts      # WSL detection, bash execution, backend launch
│   │   ├── wsl-conda-env.ts  # WSL runtime setup (conda + backend deploy)
│   │   ├── env-setup.ts    # Conda pack extraction (native or WSL)
│   │   ├── backend-process.ts  # Spawn/stop FastAPI backend
│   │   └── index.ts    # App entry, first-run setup window
│   ├── preload/        # IPC bridge
│   └── renderer/       # React UI
├── resources/          # Bundled at build time (backend, conda packs)
├── electron-builder.yml
└── package.json
```

### Production runtime

On first launch (non-dev), the app checks whether the bundled Conda environment matches the app version:

- **Linux**: extracts `conda-env.tar.gz` to the user data directory
- **Windows**: installs conda + backend inside WSL at `~/.rt-metagenomics/` (conda env, `back/app`, database)

The backend then runs:

- **Linux**: native uvicorn from the extracted environment
- **Windows**: uvicorn inside WSL at `~/.rt-metagenomics/back/app`; front connects via `http://127.0.0.1:8000` (`RT_META_WSL=1`)

The SQLite database lives in the Electron user data folder on Linux, and at `~/.rt-metagenomics/rtmeta.db` inside WSL on Windows.

## Building installers

Use the root build scripts — they handle Conda packing, copying `back/app` into `resources/`, and invoking electron-builder.

### Linux

```bash
cd ..
./build.sh --linux
```

Artifacts appear in `front/dist/` (AppImage, `.deb`).

### Windows

Requires the Linux Conda pack at `front/resources/conda-env-linux.tar.gz`:

```powershell
cd ..
.\build.ps1 -Platform win
```

Artifacts: NSIS installer and portable `.exe` in `front/dist/`.

### electron-builder config

Platform-specific extra resources are defined in `electron-builder.yml`:

- **Windows**: `conda-env-linux.tar.gz` (WSL backend)
- **Linux**: `conda-env.tar.gz` (native backend)

Both platforms bundle `resources/back/app` as the FastAPI application.

## Windows / WSL first-run wizard

On first launch, the packaged Windows app runs an automated setup:

| Step | Action |
|------|--------|
| 1. WSL2 platform | Elevated `wsl --install --no-distribution --web-download` |
| 2. Restart | Offered when Windows requires reboot |
| 3. `rt-meta` distro | Ubuntu rootfs download + `wsl --import` |
| 4. Conda pack | Extract bundled bioinformatics environment to WSL |
| 5. Backend | Copy `back/app` to `~/.rt-metagenomics/back/app` in WSL |

Implementation files:

- `src/main/wsl-setup.ts` — WSL install and distro import orchestration
- `src/main/first-run-setup.ts` — full first-run pipeline
- `src/main/setup-window.ts` — progress UI with step indicators

The dedicated WSL distro name is `rt-meta`. All backend commands run with `wsl -d rt-meta`.

### Requirements

- Internet on first setup (Ubuntu rootfs download, ~350 MB, cached locally)
- Administrator approval for WSL feature installation
- One Windows restart on most machines (handled by the wizard)

### Manual fallback

```powershell
wsl --install --no-distribution
# restart, then launch RT-Metagenomics
```

## Troubleshooting

### Backend fails to start in dev (Windows)

Ensure `conda activate rt-meta` works in a terminal and that the `rt-meta` environment includes uvicorn and the backend dependencies.

### Packaged app stuck on setup (Windows)

Confirm WSL2 is installed (`wsl --status`) and that Ubuntu has been opened at least once. Check `%APPDATA%\rt-metagenomics\logs` or the in-app backend monitor for errors.

### Build fails: missing conda pack

Windows builds require `front/resources/conda-env-linux.tar.gz`. Build it on Linux with `./build.sh --linux` and copy `conda-env.tar.gz` to that path, or download the CI artifact.
