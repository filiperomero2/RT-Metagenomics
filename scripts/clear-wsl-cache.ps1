<#
.SYNOPSIS
  Stop WSL and remove local RT-Metagenomics WSL build cache files.
#>
param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$CacheDir = Join-Path $RepoRoot ".wsl\cache"

Write-Host "Stopping WSL..." -ForegroundColor Yellow
& wsl.exe --shutdown 2>$null | Out-Null
Start-Sleep -Seconds 2

function Remove-LockedPath {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    return
  }

  for ($attempt = 1; $attempt -le 5; $attempt++) {
    try {
      Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
      return
    }
    catch {
      if ($attempt -eq 5) {
        throw @(
          "Could not delete locked path: $Path"
          "Close other PowerShell windows running pack-conda-linux.ps1,"
          "wait for antivirus scans to finish, then run:"
          "  .\scripts\clear-wsl-cache.ps1"
        ) -join [Environment]::NewLine
      }

      Write-Host "      File still locked, retrying in 2s ($attempt/5)..." -ForegroundColor DarkYellow
      & wsl.exe --shutdown 2>$null | Out-Null
      Start-Sleep -Seconds 2
    }
  }
}

if (Test-Path $CacheDir) {
  Write-Host "Removing $CacheDir ..." -ForegroundColor Yellow
  Remove-LockedPath -Path $CacheDir
}

Write-Host "WSL cache cleared." -ForegroundColor Green
