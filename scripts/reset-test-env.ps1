<#
.SYNOPSIS
  Reset the RT-Metagenomics WSL test environment so database bootstrap can run again.

.DESCRIPTION
  Runs scripts/reset-test-env.sh inside the rt-meta WSL distro.

.PARAMETER Level
  bootstrap - Remove downloaded databases and DB config rows (default)
  app       - bootstrap + delete rtmeta.db and pipeline output
  full      - Remove entire ~/.rt-metagenomics (conda env, backend copy, setup marker)

.PARAMETER Distro
  WSL distro name (default: rt-meta)

.PARAMETER KeepBackendRunning
  Do not stop uvicorn before reset

.EXAMPLE
  .\scripts\reset-test-env.ps1

.EXAMPLE
  .\scripts\reset-test-env.ps1 -Level app

.EXAMPLE
  .\scripts\reset-test-env.ps1 -Level full
#>
param(
  [ValidateSet("bootstrap", "app", "full")]
  [string]$Level = "bootstrap",

  [string]$Distro = "rt-meta",

  [switch]$KeepBackendRunning
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$BashScript = Join-Path $RepoRoot "scripts\reset-test-env.sh"

if (-not (Test-Path -LiteralPath $BashScript)) {
  throw "Reset script not found: $BashScript"
}

function Test-WslDistro {
  param([string]$Name)

  $list = & wsl.exe -l -q 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $false
  }

  foreach ($line in ($list -split "`r?`n")) {
    if ($line.Trim() -eq $Name) {
      return $true
    }
  }

  return $false
}

function ConvertTo-WslPath {
  param([Parameter(Mandatory)][string]$Path)

  $full = [System.IO.Path]::GetFullPath($Path)
  if ($full -match '^([A-Za-z]):\\(.*)$') {
    $drive = $Matches[1].ToLower()
    $rest = $Matches[2].Replace("\", "/")
    return "/mnt/$drive/$rest"
  }

  return $full.Replace("\", "/")
}

function Get-NormalizedBashScript {
  param([Parameter(Mandatory)][string]$Path)

  $content = [System.IO.File]::ReadAllText($Path)
  $content = $content -replace "`r`n", "`n"
  $content = $content -replace "`r", "`n"
  return $content
}

function Invoke-WslBashScript {
  param(
    [Parameter(Mandatory)][string]$Distro,
    [Parameter(Mandatory)][string]$ScriptBody,
    [Parameter(Mandatory)][string[]]$Arguments
  )

  $tempScript = Join-Path $env:TEMP ("rt-meta-reset-{0}.sh" -f [Guid]::NewGuid().ToString("N"))
  try {
    [System.IO.File]::WriteAllText(
      $tempScript,
      $ScriptBody,
      [System.Text.UTF8Encoding]::new($false)
    )

    $wslScript = ConvertTo-WslPath -Path $tempScript
    $escapedArgs = ($Arguments | ForEach-Object { "'$($_ -replace "'", "'\\''")'" }) -join " "
    & wsl.exe -d $Distro -u root -e bash -lc "bash '$wslScript' $escapedArgs"
    return $LASTEXITCODE
  }
  finally {
    if (Test-Path -LiteralPath $tempScript) {
      Remove-Item -LiteralPath $tempScript -Force
    }
  }
}

if (-not (Test-WslDistro -Name $Distro)) {
  throw "WSL distro '$Distro' was not found. Install or start the RT-Metagenomics WSL environment first."
}

Write-Host "Reset level: $Level" -ForegroundColor Cyan
Write-Host "WSL distro:  $Distro" -ForegroundColor Cyan

if (-not $KeepBackendRunning) {
  Write-Host "Stopping backend in WSL..." -ForegroundColor Yellow
  & wsl.exe -d $Distro -u root -e bash -lc "pkill -f 'uvicorn main:app' || true" 2>$null | Out-Null
  Start-Sleep -Seconds 1
}

$WslScriptPath = ConvertTo-WslPath -Path $BashScript
$ScriptBody = Get-NormalizedBashScript -Path $BashScript
Write-Host "Running reset inside WSL..." -ForegroundColor Yellow
Write-Host "  $WslScriptPath" -ForegroundColor DarkGray

$exitCode = Invoke-WslBashScript -Distro $Distro -ScriptBody $ScriptBody -Arguments @($Level)
if ($exitCode -ne 0) {
  throw "Reset script failed with exit code $exitCode"
}

Write-Host ""
Write-Host "Environment reset complete." -ForegroundColor Green
switch ($Level) {
  "bootstrap" {
    Write-Host "Next: restart the app (or 'cd front; bun run dev') to re-run database bootstrap." -ForegroundColor Green
  }
  "app" {
    Write-Host "Next: restart the app. Settings, runs, and databases were cleared." -ForegroundColor Green
  }
  "full" {
    Write-Host "Next: restart the packaged app to run the full WSL setup wizard again." -ForegroundColor Green
    Write-Host "For dev mode, ensure ~/.rt-metagenomics/conda-env exists or run the installer setup once." -ForegroundColor DarkYellow
  }
}
