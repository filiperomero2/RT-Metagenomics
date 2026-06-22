# RT-Metagenomics

RT-Metagenomics is a real-time metagenomic analysis platform with a Python/FastAPI backend and an Electron desktop frontend. The pipeline uses [ViralUnity](https://github.com/filiperomero2/ViralUnity/) (Snakemake + Bioconda) to process metagenomic data.

## Overview

| Component | Technology |
|-----------|------------|
| Frontend | Electron, React, Vite, Bun |
| Backend | FastAPI, SQLAlchemy, ViralUnity |
| Pipeline runtime | Linux (native or via WSL2 on Windows) |

The desktop app bundles a packed Conda environment on first launch. On **Windows**, the bioinformatics stack runs inside **WSL2** because Snakemake and several Bioconda tools are not available on native Windows.

## Desktop app (recommended)

Download the latest release installer for your platform:

- **Linux**: AppImage or `.deb`
- **Windows**: NSIS installer (`.exe`) — requires WSL2

After installation, launch RT-Metagenomics. On the first run, the app extracts the Conda environment (this can take a few minutes). The backend API listens on `http://127.0.0.1:8000`.

### Windows requirements (WSL2)

The metagenomics pipeline does not run on native Windows. The Windows build uses WSL2 to run the Linux backend.

**First launch setup wizard** (automated):

1. **WSL2 platform** — the app requests administrator approval and runs `wsl --install --no-distribution --web-download`
2. **Restart** — if Windows requires it, the app offers “Restart Now” and continues after reboot
3. **Linux environment** — downloads an Ubuntu rootfs (~350 MB, cached) and creates a dedicated WSL distro named `rt-meta`
4. **Analysis tools** — extracts the bundled Linux Conda pack into `~/.rt-metagenomics/conda-env` inside WSL

No manual `wsl --install` or opening Ubuntu is required. An internet connection is needed on first setup for the Ubuntu base image download.

Manual fallback if the wizard fails:

```powershell
wsl --install --no-distribution
# restart, then launch RT-Metagenomics again
```

Sample and database paths on Windows drives (e.g. `D:\data\samples`) are converted automatically to WSL paths (`/mnt/d/data/samples`).

## Development

### Prerequisites

- [Miniforge](https://github.com/conda-forge/miniforge) or Miniconda with the `rt-meta` environment
- [Bun](https://bun.sh/) (frontend package manager and build tool)
- Git with submodules:

  ```bash
  git clone --recurse-submodules https://github.com/filiperomero2/RT-Metagenomics.git
  cd RT-Metagenomics
  ```

  If already cloned without submodules:

  ```bash
  git submodule update --init --recursive
  ```

### Backend setup

See [back/README.md](back/README.md) for Conda environment setup and API details.

On **Linux**, install the full environment including ViralUnity's Bioconda dependencies. On **Windows**, use WSL2 for pipeline development, or run only the API locally without executing Snakemake workflows.

### Frontend (Electron) dev server

```bash
cd front
bun install
bun run dev
```

In development mode, the Electron app expects a local Conda environment named `rt-meta` for the backend. Start the backend separately if needed — see [back/README.md](back/README.md).

## Building installers

Build scripts live at the repository root and produce artifacts in `front/dist/`.

### Linux

```bash
./build.sh --linux
```

This installs Conda dependencies, packs the environment to `front/resources/conda-env.tar.gz`, copies the backend, and runs `electron-builder`.

### Windows

Windows builds bundle the **Linux** Conda pack for WSL. You need `front/resources/conda-env-linux.tar.gz` before building:

```powershell
# Build the Linux pack on Linux or download the CI artifact, then:
# copy front/resources/conda-env.tar.gz → front/resources/conda-env-linux.tar.gz

.\build.ps1 -Platform win
```

Output: `front/dist/rt-metagenomics-*-setup.exe` (NSIS installer) and portable `.exe`.

### CI / releases

GitHub Actions (`.github/workflows/build-release.yml`) builds the Linux Conda pack once, then packages Linux and Windows installers. Trigger on version tags (`v*`) or via workflow dispatch.

## Docker (alternative)

Docker provides a self-contained Linux environment without installing Conda locally.

### Build and run

```bash
docker build -t rt-meta:latest .
docker run -p 3000:3000 -p 8000:8000 rt-meta:latest
```

### Production run with volume mapping

```bash
docker run -d \
  --name rt-metagenomics \
  -p 3000:3000 \
  -p 8000:8000 \
  -v /:/ \
  rt-meta:latest
```

The `-v /:/` mapping gives the container access to host files. Adjust the host path before `:` to match where your data lives; paths inside the app must be relative to that mount.

### Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API docs**: http://localhost:8000/docs

## Project structure

```
RT-Metagenomics/
├── back/                    # FastAPI backend + ViralUnity submodule
├── front/                   # Electron desktop app (React + Vite)
├── build.sh                 # Linux build script
├── build.ps1                # Windows build script
├── Dockerfile               # Docker image
└── README.md
```

## Troubleshooting

### Windows: "WSL2 is required" / setup failed

Launch the app again and follow the setup wizard. If WSL installation fails:

- Run PowerShell as Administrator: `wsl --install --no-distribution`
- Restart Windows and reopen the app
- Ensure virtualization is enabled in BIOS/UEFI

### Windows: setup download failed

The wizard downloads an Ubuntu base image on first run. Check your internet connection and retry. The file is cached under the app user data folder for subsequent attempts.

### Windows: pipeline fails with missing tools

Ensure you are using a Windows installer built with the Linux Conda pack (WSL backend). Native Windows Conda cannot run Snakemake/ViralUnity workflows.

### First-run setup is slow

Extracting the packed Conda environment is normal and only happens once per app version.

### Permission / path errors (Docker)

Verify volume mappings and file permissions on the host paths you reference in the app.

### Build: missing `conda-env-linux.tar.gz`

Build the Linux pack with `./build.sh --linux` on Linux, or download the `conda-env-linux` artifact from GitHub Actions, and place it at `front/resources/conda-env-linux.tar.gz`.

## Documentation

- [back/README.md](back/README.md) — backend API, Conda setup, WSL path handling
- [front/README.md](front/README.md) — Electron app development and packaging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes and test on Linux (or Windows + WSL2 for the full pipeline)
4. Submit a pull request

## License

TBD

## Support

For issues and questions, check the troubleshooting section above, review the component READMEs, or open an issue on GitHub.
