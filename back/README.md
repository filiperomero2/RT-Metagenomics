# RT-Metagenomics Backend API

FastAPI backend for RT-Metagenomics. It exposes a REST API for managing metagenomics runs and delegates pipeline execution to [ViralUnity](https://github.com/filiperomero2/ViralUnity/) (Snakemake workflows).

## Platform support

| Platform | API | Metagenomics pipeline |
|----------|-----|------------------------|
| Linux | Native | Native (Conda/Bioconda) |
| Windows (dev) | Native Conda | Not supported natively |
| Windows (packaged app) | Via WSL2 | Linux Conda inside WSL |

Snakemake and several Bioconda tools used by ViralUnity are **Linux-only**. The packaged Electron app on Windows runs this backend inside WSL2 with a bundled Linux Conda environment.

When running under WSL, the main process sets `RT_META_WSL=1`. Path fields from the Windows UI (e.g. `D:\data\samples`) are normalized to WSL paths (e.g. `/mnt/d/data/samples`) via `infra/path_utils.py` before ViralUnity executes.

## Project structure

```
back/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Configuration
│   ├── routers/v1/          # API routes
│   ├── schemas/             # Request/response models
│   ├── entities/            # Database models
│   ├── services/            # Domain services (incl. ViralUnityService)
│   ├── usecases/            # Application logic
│   └── infra/
│       └── path_utils.py    # Windows → WSL path conversion
├── environment.yml          # Base Conda dependencies
└── README.md
```

### Key components

- **ViralUnityService**: runs metagenomics workflows in a background thread
- **path_utils**: converts Windows paths when `RT_META_WSL=1`
- **Exception handling**: centralized API error responses
- **Dependency injection**: `dependency-injector` container

## Setup (Linux)

### 1. Clone with submodules

```bash
git clone --recurse-submodules <repository-url>
cd RT-Metagenomics/back
```

If submodules are missing:

```bash
git submodule update --init --recursive
```

### 2. Create Conda environment

```bash
conda create -n rt-meta python=3.11
conda activate rt-meta
```

### 3. Install dependencies

```bash
conda env update -n rt-meta --file app/viralunity/environment.yml
conda env update -n rt-meta --file environment.yml
pip install -e app/viralunity
```

### 4. Environment variables

Create a `.env` file in `back/app/` (or set variables in the shell):

```env
DATABASE_URL=sqlite:///./rtmeta.db
DATABASE_ECHO=false
POLLING_INTERVAL=1
DEFAULT_MINIMUM_READ_LENGTH=50
API_TITLE=RT-Metagenomics API
API_VERSION=1.0.0
LOG_LEVEL=INFO
```

In the packaged desktop app, `DATABASE_URL` is set automatically:

- **Linux**: SQLite file in the Electron user data directory
- **Windows (WSL)**: `sqlite:///$HOME/.rt-metagenomics/rtmeta.db` inside WSL

## Running the API

### Development

```bash
conda activate rt-meta
cd app
uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
```

Deterministic import path (from repository root):

```bash
cd back
PYTHONPATH="$PWD/app" uvicorn main:app --app-dir app --host 0.0.0.0 --port 8000 --reload
```

### Production (standalone)

```bash
conda activate rt-meta
cd app
uvicorn main:app --host 127.0.0.1 --port 8000
```

The Electron app spawns uvicorn automatically in production. On Windows installers, it runs inside the `rt-meta` WSL distro from `~/.rt-metagenomics/back/app` with `PYTHONPATH` pointing at the bundled `viralunity` directory.

## API documentation

- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## WSL setup (packaged Windows app)

The Electron main process runs a first-run wizard that:

1. Installs the WSL2 platform (elevated, with reboot handling)
2. Creates a dedicated `rt-meta` WSL distro via `wsl --import`
3. Extracts the Linux Conda pack to `~/.rt-metagenomics/conda-env` and copies the backend to `~/.rt-metagenomics/back/app`

When running under WSL, the main process sets `RT_META_WSL=1` and `RT_META_WSL_DISTRO=rt-meta`. The backend runs entirely from the WSL filesystem; the front connects via `http://127.0.0.1:8000`.

## WSL path handling

Path conversion is only needed for **user-selected files** from Windows dialogs (e.g. sample folders). The backend code and conda environment live inside WSL at `~/.rt-metagenomics/`.

When `RT_META_WSL=1`, `normalize_path()` in `infra/path_utils.py` converts Windows-style paths before they reach ViralUnity:

```python
from infra.path_utils import normalize_path

sample_root = normalize_path(run.parameters.path)
```

Conversion rules:

- `D:\data\samples` → `/mnt/d/data/samples`
- Paths already in Unix form are left unchanged

## Windows development notes

- You can run the FastAPI server on native Windows for UI/API development.
- Installing the full ViralUnity Bioconda stack on native Windows is not supported (Snakemake/datrie build failures).
- For pipeline testing on Windows, use **WSL2** with a Linux `rt-meta` environment, or use the packaged desktop app.

## Configuration reference

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLAlchemy connection string |
| `DATABASE_ECHO` | Log SQL queries |
| `POLLING_INTERVAL` | Background service poll interval (seconds) |
| `DEFAULT_MINIMUM_READ_LENGTH` | Default read length filter |
| `RT_META_WSL` | Set to `1` when backend runs inside WSL (automatic in packaged Windows app) |
| `RT_META_WSL_DISTRO` | WSL distro name (`rt-meta` in packaged Windows app) |
| `RT_META_APP_VERSION` | App version string (set by Electron main process) |
| `PYTHONPATH` | Must include `viralunity` package root in production |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test pipeline changes on **Linux** (or WSL2 on Windows)
4. Open a pull request

## License

TBD
