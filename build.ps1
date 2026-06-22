<#
.SYNOPSIS
  Build RT-Metagenomics for Windows (or cross-platform with flags).
.PARAMETER Platform
  Target platform: win, linux, or all. Defaults to win.
.PARAMETER PackLinuxConda
  Build front/resources/conda-env-linux.tar.gz via WSL (required before Windows packaging).
#>
param(
  [ValidateSet("win", "linux", "all")]
  [string]$Platform = "win",
  [switch]$PackLinuxConda
)

$ErrorActionPreference = "Stop"
$CondaEnv = "rt-meta"
$Root = $PSScriptRoot
$LinuxCondaTarball = Join-Path $Root "front\resources\conda-env-linux.tar.gz"
$script:BunExe = $null
$script:CondaExe = $null

function Write-Step {
  param([string]$Message)
  Write-Host $Message -ForegroundColor Yellow
}

function Write-Banner {
  param([string]$Message, [ConsoleColor]$Color = [ConsoleColor]::Cyan)
  Write-Host ""
  Write-Host "=======================================" -ForegroundColor $Color
  Write-Host "  $Message" -ForegroundColor $Color
  Write-Host "=======================================" -ForegroundColor $Color
  Write-Host ""
}

function Get-BunExecutable {
  if ($script:BunExe -and (Test-Path $script:BunExe)) {
    return $script:BunExe
  }

  if (Get-Command bun -ErrorAction SilentlyContinue) {
    $script:BunExe = (Get-Command bun).Source
    return $script:BunExe
  }

  $bunCandidates = @(
    "$env:USERPROFILE\.bun\bin\bun.exe",
    "$env:LOCALAPPDATA\bun\bin\bun.exe"
  )

  foreach ($bunExe in $bunCandidates) {
    if (Test-Path $bunExe) {
      $env:Path = "$(Split-Path $bunExe -Parent);$env:Path"
      $script:BunExe = $bunExe
      return $script:BunExe
    }
  }

  throw @"
bun not found. Install it and reopen the terminal, or run:
  powershell -c "irm bun.sh/install.ps1 | iex"
Then run: .\build.ps1 -Platform win
"@
}

function Get-CondaExecutable {
  if ($script:CondaExe -and (Test-Path $script:CondaExe)) {
    return $script:CondaExe
  }

  if (Get-Command conda -ErrorAction SilentlyContinue) {
    $script:CondaExe = (Get-Command conda).Source
    return $script:CondaExe
  }

  $condaCandidates = @(
    "$env:USERPROFILE\miniforge3",
    "$env:USERPROFILE\miniconda3",
    "$env:ProgramData\miniforge3",
    "$env:ProgramData\miniconda3"
  )

  foreach ($base in $condaCandidates) {
    $condaExe = Join-Path $base "Scripts\conda.exe"
    if (Test-Path $condaExe) {
      $env:Path = "$base\Scripts;$base\condabin;$base\envs\$CondaEnv\Scripts;$env:Path"
      $script:CondaExe = $condaExe
      return $script:CondaExe
    }
  }

  throw "conda not found. Install Miniforge/Miniconda and ensure the rt-meta environment exists."
}

function Initialize-BunPath {
  [void](Get-BunExecutable)
}

function Initialize-CondaPath {
  [void](Get-CondaExecutable)
}

function Invoke-Conda {
  param([string[]]$CondaArgs)

  $condaExe = Get-CondaExecutable
  & $condaExe @CondaArgs
  if ($LASTEXITCODE -ne 0) {
    throw "conda $($CondaArgs -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Invoke-CondaPip {
  param(
    [Parameter(Mandatory)][string[]]$Packages,
    [switch]$Optional
  )

  $condaArgs = @("run", "-n", $CondaEnv, "pip", "install") + $Packages
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $condaExe = Get-CondaExecutable
    & $condaExe @condaArgs
    if ($LASTEXITCODE -ne 0) {
      if ($Optional) {
        Write-Warning "Optional pip install failed: $($Packages -join ' ')"
        return
      }
      throw "pip install failed: $($Packages -join ' ')"
    }
  }
  finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Invoke-Checked {
  param(
    [scriptblock]$Command,
    [string]$FailureMessage
  )

  & $Command
  if ($LASTEXITCODE -ne 0) {
    throw $FailureMessage
  }
}

function Install-CondaRuntime {
  Write-Step "[1/5] Installing conda runtime dependencies..."
  Invoke-Conda @("env", "update", "-n", $CondaEnv, "--file", "back/environment.yml", "--prune")

  $vuDir = Join-Path $Root "back\app\viralunity"
  Invoke-CondaPip @("biopython", "pyyaml>=6.0", "click>=8.0")
  Invoke-CondaPip @($vuDir, "--no-deps")

  if ($Platform -eq "win") {
    Write-Host "      Skipping snakemake on Windows (requires MSVC build tools)."
    Write-Host "      Backend will start; metagenomics pipeline runs need a Linux build."
  }
  else {
    Invoke-CondaPip @("snakemake>=7.32,<8")
  }

  Invoke-Conda @("install", "-n", $CondaEnv, "conda-pack", "-y")
}

function Ensure-WslLinuxCondaPack {
  if (-not (Test-Path $LinuxCondaTarball)) {
    throw @"
Missing front/resources/conda-env-linux.tar.gz (required for Windows/WSL builds).

Option A — build locally with WSL (after wsl --install and reboot):
  .\build.ps1 -PackLinuxConda
  .\build.ps1 -Platform win

Option B — GitHub Actions (no local WSL):
  1. Push this repo to GitHub
  2. Actions → "Pack Conda Linux" → Run workflow
  3. Download artifact conda-env-linux
  4. Save as front/resources/conda-env-linux.tar.gz
  5. Run: .\build.ps1 -Platform win
"@
  }

  $sizeMb = (Get-Item $LinuxCondaTarball).Length / 1MB
  Write-Host ("      Linux conda pack ready: {0:N1} MB" -f $sizeMb)
}

function Invoke-CondaPack {
  $resourcesDir = Join-Path $Root "front\resources"
  if (-not (Test-Path $resourcesDir)) {
    New-Item -ItemType Directory -Path $resourcesDir | Out-Null
  }

  $output = Join-Path $resourcesDir "conda-env.tar.gz"
  Invoke-Conda @(
    "run", "-n", $CondaEnv, "conda-pack",
    "--name", $CondaEnv,
    "--output", $output,
    "--ignore-editable-packages",
    "--force"
  )

  $sizeMb = (Get-Item $output).Length / 1MB
  Write-Host ("      Packed: {0:N1} MB" -f $sizeMb)
}

function Copy-BackendResources {
  $targetDir = Join-Path $Root "front\resources\back"
  if (Test-Path $targetDir) {
    Remove-Item -Recurse -Force $targetDir
  }

  $appDir = Join-Path $targetDir "app"
  New-Item -ItemType Directory -Path $appDir -Force | Out-Null
  Copy-Item -Recurse -Force (Join-Path $Root "back\app\*") $appDir

  Get-ChildItem -Recurse -Directory -Filter "__pycache__" -Path $targetDir |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
  Get-ChildItem -Recurse -Filter "*.pyc" -Path $targetDir |
    Remove-Item -Force -ErrorAction SilentlyContinue
  Remove-Item -Force (Join-Path $appDir "rtmeta.db") -ErrorAction SilentlyContinue
}

function Invoke-ElectronBuilder {
  param([string]$TargetPlatform)

  $bunExe = Get-BunExecutable
  $env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

  switch ($TargetPlatform) {
    "linux" {
      Invoke-Checked { & $bunExe x electron-builder --linux --publish never } "electron-builder failed for linux."
    }
    "win" {
      Invoke-Checked { & $bunExe x electron-builder --win --publish never } "electron-builder failed for win."
    }
    "all" {
      Invoke-Checked { & $bunExe x electron-builder --linux --win --publish never } "electron-builder failed for linux/win."
    }
    default {
      throw "Unsupported platform: $TargetPlatform"
    }
  }
}

Push-Location $Root

try {
  if ($PackLinuxConda) {
    & (Join-Path $Root "scripts\pack-conda-linux.ps1") -RepoRoot $Root
    exit 0
  }

  Write-Banner "RT-Metagenomics - Build ($Platform)"

  $bunExe = Get-BunExecutable
  Write-Host "Using bun: $bunExe" -ForegroundColor DarkGray

  if ($Platform -eq "win") {
    Write-Step "[1/5] Validating Linux conda pack for WSL backend..."
    Ensure-WslLinuxCondaPack
  }
  else {
    Initialize-CondaPath
    Write-Host "Using conda: $(Get-CondaExecutable)" -ForegroundColor DarkGray
    Install-CondaRuntime
    Write-Step "[2/5] Packing conda environment '$CondaEnv'..."
    Invoke-CondaPack
  }

  Write-Step "[$(if ($Platform -eq 'win') { '2/5' } else { '3/5' })] Copying backend source..."
  Copy-BackendResources

  Write-Step "[$(if ($Platform -eq 'win') { '3/5' } else { '4/5' })] Building Electron app..."
  Push-Location (Join-Path $Root "front")
  try {
    Invoke-Checked { & $bunExe run prebuild } "electron-vite build failed."

    Write-Step "[$(if ($Platform -eq 'win') { '4/5' } else { '5/5' })] Packaging for: $Platform ..."
    Invoke-ElectronBuilder -TargetPlatform $Platform
  }
  finally {
    Pop-Location
  }

  Write-Banner "Build complete!" ([ConsoleColor]::Green)
  Write-Host "Artifacts:"
  Get-ChildItem -Path (Join-Path $Root "front\dist") -ErrorAction SilentlyContinue |
    Format-Table Name, Length -AutoSize
}
catch {
  Write-Host ""
  Write-Host "Build failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
finally {
  Pop-Location
}
