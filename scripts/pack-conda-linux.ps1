<#
.SYNOPSIS
  Build front/resources/conda-env-linux.tar.gz using WSL (Linux Conda/Bioconda).

.DESCRIPTION
  Windows cannot pack the Linux bioinformatics environment natively.
  Bootstraps a dedicated WSL distro if needed, then runs the same steps as CI.
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [switch]$ForceRefreshCache
)

$ErrorActionPreference = "Stop"
$OutputTarball = Join-Path $RepoRoot "front\resources\conda-env-linux.tar.gz"
$CondaEnv = "rt-meta"
$BuildDistro = "rt-meta-build"
$UbuntuRootfsUrl = "https://cloud-images.ubuntu.com/wsl/releases/22.04/current/ubuntu-jammy-wsl-amd64-wsl.rootfs.tar.gz"

function Write-SetupHelp {
  param([string]$Reason)

  $message = @(
    $Reason
    ""
    "1. Open PowerShell as Administrator:"
    "     wsl --install --no-distribution"
    "2. Restart Windows"
    "3. Run:"
    "     .\build.ps1 -PackLinuxConda"
    ""
    "Alternatively, trigger the Pack Conda Linux workflow on GitHub Actions"
    "and download the conda-env-linux artifact into front/resources/."
  ) -join [Environment]::NewLine

  throw $message
}

function Get-WslPath {
  param([string]$WindowsPath)

  $fullPath = (Resolve-Path $WindowsPath).Path
  $drive = $fullPath.Substring(0, 1).ToLower()
  $rest = $fullPath.Substring(2).Replace("\", "/").TrimStart("/")
  if ($rest) {
    return "/mnt/$drive/$rest"
  }
  return "/mnt/$drive"
}

function Test-WslPlatformInstalled {
  $null = & wsl.exe --status 2>&1
  return $LASTEXITCODE -eq 0
}

function Get-WslDistroListText {
  $output = & wsl.exe -l -v 2>&1 | Out-String
  return ($output -replace "`0", "")
}

function Test-DistroRegistered {
  param(
    [string]$DistroName,
    [string]$ListText = (Get-WslDistroListText)
  )

  return $ListText -match "(?i)\b$([regex]::Escape($DistroName))\b"
}

function Test-DistroRunnable {
  param([string]$DistroName)

  if (-not (Test-DistroRegistered -DistroName $DistroName)) {
    return $false
  }

  & wsl.exe -d $DistroName -e bash -lc "echo ok" 2>$null | Out-Null
  return $LASTEXITCODE -eq 0
}

function Get-RunnableDistro {
  $list = Get-WslDistroListText
  foreach ($name in @($BuildDistro, "rt-meta", "Ubuntu", "ubuntu")) {
    if (Test-DistroRunnable -DistroName $name) {
      return $name
    }
  }

  foreach ($line in ($list -split "`n")) {
    if ($line -match "^\s*([^\s]+)\s") {
      $candidate = $Matches[1]
      if ($candidate -notmatch "^(NAME|Windows|Subsistema|docker-desktop)" -and
          (Test-DistroRunnable -DistroName $candidate)) {
        return $candidate
      }
    }
  }

  return $null
}

function Stop-WslForFileOps {
  & wsl.exe --shutdown 2>$null | Out-Null
  Start-Sleep -Seconds 1
}

function Remove-PathWithRetry {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return
  }

  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      Remove-Item -LiteralPath $Path -Force -Recurse -ErrorAction Stop
      return
    }
    catch {
      if ($attempt -eq 5) {
        throw "Could not delete locked path: $Path. Run: .\scripts\clear-wsl-cache.ps1"
      }
      Stop-WslForFileOps
      Start-Sleep -Seconds 2
    }
  }
}

function Download-UbuntuRootfs {
  param([string]$Destination)

  $minGzipBytes = 200MB
  $partialPath = "$Destination.partial"

  if ($ForceRefreshCache) {
    Stop-WslForFileOps
    Remove-PathWithRetry -Path $Destination
    Remove-PathWithRetry -Path ($Destination -replace '\.gz$', '')
    Remove-PathWithRetry -Path $partialPath
  }

  if (Test-Path $Destination) {
    $size = (Get-Item $Destination).Length
    if ($size -ge $minGzipBytes) {
      Write-Host "      Using cached Ubuntu rootfs ($([math]::Round($size / 1MB, 1)) MB)." -ForegroundColor DarkGray
      return
    }

    Write-Host "      Cached rootfs looks incomplete - re-downloading..." -ForegroundColor Yellow
    Stop-WslForFileOps
    Remove-PathWithRetry -Path $Destination
  }

  $destDir = Split-Path $Destination -Parent
  if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
  }

  Remove-PathWithRetry -Path $partialPath

  Write-Host "      Downloading Ubuntu 22.04 rootfs (~350 MB, one-time)..." -ForegroundColor Yellow
  try {
    Invoke-WebRequest -Uri $UbuntuRootfsUrl -OutFile $partialPath -UseBasicParsing
    Move-Item -LiteralPath $partialPath -Destination $Destination -Force
  }
  catch {
    Remove-PathWithRetry -Path $partialPath
    throw
  }
}

function Expand-RootfsTarGz {
  param(
    [string]$GzipPath,
    [string]$TarPath
  )

  $minTarBytes = 500MB
  if ((Test-Path $TarPath) -and ((Get-Item $TarPath).Length -ge $minTarBytes)) {
    Write-Host "      Using cached decompressed rootfs tar." -ForegroundColor DarkGray
    return $TarPath
  }

  if (Test-Path $TarPath) {
    Stop-WslForFileOps
    Remove-PathWithRetry -Path $TarPath
  }

  if (-not (Test-Path $GzipPath)) {
    throw "Rootfs archive not found: $GzipPath"
  }

  Write-Host "      Decompressing rootfs (.tar.gz -> .tar) for WSL import..." -ForegroundColor Yellow
  $tempTarPath = "$TarPath.partial"
  Remove-PathWithRetry -Path $tempTarPath

  $inputStream = $null
  $gzip = $null
  $outputStream = $null
  try {
    $inputStream = [System.IO.File]::Open(
      $GzipPath,
      [System.IO.FileMode]::Open,
      [System.IO.FileAccess]::Read,
      [System.IO.FileShare]::Read
    )
    $gzip = New-Object System.IO.Compression.GzipStream(
      $inputStream,
      [System.IO.Compression.CompressionMode]::Decompress
    )
    $outputStream = [System.IO.File]::Create($tempTarPath)
    $gzip.CopyTo($outputStream)
  }
  finally {
    if ($outputStream) { $outputStream.Dispose() }
    if ($gzip) { $gzip.Dispose() }
    if ($inputStream) { $inputStream.Dispose() }
  }

  Move-Item -LiteralPath $tempTarPath -Destination $TarPath -Force

  if (-not (Test-Path $TarPath) -or (Get-Item $TarPath).Length -lt $minTarBytes) {
    Remove-Item -Force $TarPath -ErrorAction SilentlyContinue
    throw "Decompressed rootfs tar is missing or too small. Delete .wsl/cache and retry."
  }

  return $TarPath
}

function Import-BuildDistro {
  param(
    [string]$RootfsTarPath,
    [string]$DistroName = $BuildDistro
  )

  $installDir = Join-Path $RepoRoot ".wsl\$DistroName"
  if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
  }
  $installDir = (Resolve-Path $installDir).Path

  $rootfsTar = (Resolve-Path $RootfsTarPath).Path

  if (Test-DistroRegistered -DistroName $DistroName) {
    Write-Host "      Replacing existing WSL distro '$DistroName'..." -ForegroundColor DarkGray
    & wsl.exe --terminate $DistroName 2>$null | Out-Null
    & wsl.exe --unregister $DistroName 2>$null | Out-Null
  }

  Write-Host "      Importing WSL distro '$DistroName'..." -ForegroundColor Yellow
  $importOutput = & wsl.exe --import $DistroName $installDir $rootfsTar --version 2 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw @(
      "wsl --import failed with exit code $LASTEXITCODE."
      $importOutput.Trim()
      "Install dir: $installDir"
      "Rootfs tar:  $rootfsTar"
    ) -join [Environment]::NewLine
  }
}

function Ensure-WslBuildDistro {
  $existing = Get-RunnableDistro
  if ($existing) {
    Write-Host "      Using WSL distro: $existing" -ForegroundColor DarkGray
    return $existing
  }

  if (-not (Test-WslPlatformInstalled)) {
    Write-SetupHelp -Reason "WSL2 platform is not installed."
  }

  Write-Host "[0/5] No WSL Linux distro found - creating '$BuildDistro'..." -ForegroundColor Yellow
  $cacheDir = Join-Path $RepoRoot ".wsl\cache"
  if (-not (Test-Path $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
  }

  $rootfsGz = Join-Path $cacheDir "ubuntu-jammy-wsl.rootfs.tar.gz"
  $rootfsTar = Join-Path $cacheDir "ubuntu-jammy-wsl.rootfs.tar"
  Download-UbuntuRootfs -Destination $rootfsGz
  Expand-RootfsTarGz -GzipPath $rootfsGz -TarPath $rootfsTar
  Import-BuildDistro -RootfsTarPath $rootfsTar -DistroName $BuildDistro

  if (-not (Test-DistroRunnable -DistroName $BuildDistro)) {
    throw "WSL distro '$BuildDistro' was imported but could not start."
  }

  return $BuildDistro
}

function Invoke-WslBashScript {
  param(
    [string]$DistroName,
    [string]$ScriptPath
  )

  $wslScript = Get-WslPath -WindowsPath $ScriptPath
  & wsl.exe -d $DistroName -e bash $wslScript | Write-Host
  return [int]$LASTEXITCODE
}

function Write-UnixScript {
  param(
    [string]$Path,
    [string]$Content
  )

  $scriptDir = Split-Path $Path -Parent
  if (-not (Test-Path $scriptDir)) {
    New-Item -ItemType Directory -Path $scriptDir -Force | Out-Null
  }

  $normalized = ($Content -replace "`r`n", "`n") -replace "`r", "`n"
  [System.IO.File]::WriteAllText($Path, $normalized, [System.Text.UTF8Encoding]::new($false))
}

if (-not (Test-WslPlatformInstalled)) {
  Write-SetupHelp -Reason "WSL is not installed. The Linux conda pack must be built inside WSL."
}

$wslRepo = Get-WslPath -WindowsPath $RepoRoot
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

$distroName = Ensure-WslBuildDistro

$bashScript = @'
set -euo pipefail
REPO="__REPO__"
ENV="__ENV__"
OUT="$REPO/front/resources/conda-env-linux.tar.gz"

cd "$REPO"

if [ -f "$HOME/miniforge3/etc/profile.d/conda.sh" ]; then
  # shellcheck disable=SC1091
  source "$HOME/miniforge3/etc/profile.d/conda.sh"
fi

if ! command -v conda >/dev/null 2>&1; then
  echo "[1/5] Installing Miniforge in WSL..."
  curl -fsSL https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh -o /tmp/miniforge.sh
  bash /tmp/miniforge.sh -b -p "$HOME/miniforge3"
  rm -f /tmp/miniforge.sh
  # shellcheck disable=SC1091
  source "$HOME/miniforge3/etc/profile.d/conda.sh"
fi

# shellcheck disable=SC1091
source "$HOME/miniforge3/etc/profile.d/conda.sh"

if ! conda env list | awk '{print $1}' | grep -qx "$ENV"; then
  echo "[2/5] Creating conda environment '$ENV'..."
  conda create -n "$ENV" python=3.11 -y
fi

echo "[3/5] Installing dependencies (this takes a while)..."
conda env update -n "$ENV" --file back/app/viralunity/environment.yml
conda env update -n "$ENV" --file back/environment.yml
conda install -n "$ENV" conda-pack -y
conda run -n "$ENV" pip install "./back/app/viralunity"

echo "[4/5] Validating environment before pack..."
conda run -n "$ENV" python -c "import uvicorn, fastapi, sqlmodel, pydantic, dotenv"

echo "[5/5] Packing environment..."
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

$scriptPath = Join-Path $RepoRoot ".wsl\scripts\pack-conda-linux.sh"
Write-UnixScript -Path $scriptPath -Content $bashScript

$exitCode = Invoke-WslBashScript -DistroName $distroName -ScriptPath $scriptPath
if ($exitCode -ne 0) {
  throw "Linux conda pack failed inside WSL distro '$distroName' (exit code $exitCode)."
}

if (-not (Test-Path $OutputTarball)) {
  throw "Expected output was not created: $OutputTarball"
}

$sizeMb = (Get-Item $OutputTarball).Length / 1MB
$sizeLabel = "{0:N1} MB" -f $sizeMb
Write-Host ""
Write-Host "Linux conda pack ready: $OutputTarball ($sizeLabel)" -ForegroundColor Green
Write-Host 'Run: .\build.ps1 -Platform win' -ForegroundColor Green
Write-Host ""
