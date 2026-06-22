<#
.SYNOPSIS
  Build front/resources/conda-env-linux.tar.gz using WSL (Linux Conda/Bioconda).

.DESCRIPTION
  Windows cannot pack the Linux bioinformatics environment natively.
  This script bootstraps Miniforge inside WSL and runs the same steps as CI.
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$OutputTarball = Join-Path $RepoRoot "front\resources\conda-env-linux.tar.gz"
$CondaEnv = "rt-meta"

function Test-WslReady {
  try {
    $null = & wsl.exe --status 2>$null
    return $true
  } catch {
    try {
      $list = & wsl.exe -l -v 2>&1
      return ($LASTEXITCODE -eq 0 -and $list)
    } catch {
      return $false
    }
  }
}

function Get-WslRepoRoot {
  param([string]$WindowsPath)

  $drive = $WindowsPath.Substring(0, 1).ToLower()
  $rest = $WindowsPath.Substring(2).Replace("\", "/").TrimStart("/")
  if ($rest) {
    return "/mnt/$drive/$rest"
  }
  return "/mnt/$drive"
}

if (-not (Test-WslReady)) {
  throw @"
WSL is not installed. The Linux conda pack must be built inside WSL.

1. Open PowerShell as Administrator:
     wsl --install --no-distribution
2. Restart Windows
3. Run:
     .\build.ps1 -PackLinuxConda
4. Then:
     .\build.ps1 -Platform win

Alternatively, trigger the "Pack Conda Linux" workflow on GitHub Actions
and download the conda-env-linux artifact into front/resources/.
"@
}

$wslRepo = Get-WslRepoRoot -WindowsPath $RepoRoot
$resourcesDir = Join-Path $RepoRoot "front\resources"
if (-not (Test-Path $resourcesDir)) {
  New-Item -ItemType Directory -Path $resourcesDir | Out-Null
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Pack Linux Conda (via WSL)" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repo (WSL): $wslRepo" -ForegroundColor DarkGray
Write-Host "Output:     $OutputTarball" -ForegroundColor DarkGray
Write-Host ""
Write-Host "This may take 20-60 minutes on first run (Bioconda downloads)." -ForegroundColor Yellow
Write-Host ""

$bashScript = @'
set -euo pipefail
REPO="__REPO__"
ENV="__ENV__"
OUT="$REPO/front/resources/conda-env-linux.tar.gz"

cd "$REPO"

if ! command -v conda >/dev/null 2>&1; then
  echo "[1/5] Installing Miniforge in WSL..."
  curl -fsSL https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh -o /tmp/miniforge.sh
  bash /tmp/miniforge.sh -b -p "$HOME/miniforge3"
  rm -f /tmp/miniforge.sh
fi

# shellcheck disable=SC1091
source "$HOME/miniforge3/etc/profile.d/conda.sh"

if ! conda env list | awk '{print $1}' | grep -qx "$ENV"; then
  echo "[2/5] Creating conda environment '$ENV'..."
  conda create -n "$ENV" python=3.11 -y
fi

echo "[3/5] Installing dependencies (this takes a while)..."
conda env update -n "$ENV" --file back/environment.yml --prune
conda env update -n "$ENV" --file back/app/viralunity/environment.yml --prune
conda install -n "$ENV" conda-pack -y
conda run -n "$ENV" pip install "./back/app/viralunity"

echo "[4/5] Packing environment..."
mkdir -p front/resources
conda run -n "$ENV" conda-pack \
  -n "$ENV" \
  -o "$OUT" \
  --ignore-editable-packages \
  --force

echo "[5/5] Done."
ls -lh "$OUT"
'@

$bashScript = $bashScript.Replace("__REPO__", $wslRepo.Replace("'", "'\\''"))
$bashScript = $bashScript.Replace("__ENV__", $CondaEnv)

$scriptPath = Join-Path $env:TEMP "rt-meta-pack-conda-linux.sh"
[System.IO.File]::WriteAllText($scriptPath, $bashScript, [System.Text.UTF8Encoding]::new($false))
$wslScript = (Get-WslRepoRoot -WindowsPath $scriptPath) -replace "'", "'\\''"

& wsl.exe bash -lc "bash '$wslScript'"
if ($LASTEXITCODE -ne 0) {
  throw "Linux conda pack failed inside WSL (exit code $LASTEXITCODE)."
}

if (-not (Test-Path $OutputTarball)) {
  throw "Expected output was not created: $OutputTarball"
}

$sizeMb = (Get-Item $OutputTarball).Length / 1MB
Write-Host ""
Write-Host "Linux conda pack ready: $OutputTarball ($([math]::Round($sizeMb, 1)) MB)" -ForegroundColor Green
Write-Host "Run: .\build.ps1 -Platform win" -ForegroundColor Green
Write-Host ""
