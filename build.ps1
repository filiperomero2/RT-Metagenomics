<#
.SYNOPSIS
  Build RT-Metagenomics for Windows (or cross-platform with flags).
.PARAMETER Platform
  Target platform: win, linux, mac, or all. Defaults to win.
#>
param(
  [ValidateSet("win", "linux", "all")]
  [string]$Platform = "win"
)

$ErrorActionPreference = "Stop"
Push-Location $PSScriptRoot

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  RT-Metagenomics — Build ($Platform)"     -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ── 1. Pack the conda environment ──────────────────────────────────────────
Write-Host "[1/4] Packing conda environment 'rt-meta'…" -ForegroundColor Yellow
if (-not (Test-Path "front\resources")) { New-Item -ItemType Directory -Path "front\resources" | Out-Null }
conda-pack `
  --name rt-meta `
  --output front\resources\conda-env.tar.gz `
  --ignore-editable-packages `
  --force
$size = (Get-Item "front\resources\conda-env.tar.gz").Length / 1MB
Write-Host "      Packed: $([math]::Round($size, 1)) MB"

# ── 2. Copy backend source into resources ──────────────────────────────────
Write-Host "[2/4] Copying backend source…" -ForegroundColor Yellow
if (Test-Path "front\resources\back") { Remove-Item -Recurse -Force "front\resources\back" }
New-Item -ItemType Directory -Path "front\resources\back\app" -Force | Out-Null
Copy-Item -Recurse -Force "back\app\*" "front\resources\back\app\"
# Remove runtime artifacts
Get-ChildItem -Recurse -Directory -Filter "__pycache__" -Path "front\resources\back" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Recurse -Filter "*.pyc" -Path "front\resources\back" | Remove-Item -Force -ErrorAction SilentlyContinue
Remove-Item -Force "front\resources\back\app\rtmeta.db" -ErrorAction SilentlyContinue

# ── 3. Build Electron (main + renderer via electron-vite) ──────────────────
Write-Host "[3/4] Building Electron app…" -ForegroundColor Yellow
Push-Location front
bun run prebuild

# ── 4. Package with electron-builder ───────────────────────────────────────
Write-Host "[4/4] Packaging for: $Platform …" -ForegroundColor Yellow
switch ($Platform) {
  "linux" { bunx electron-builder --linux }
  "win"   { bunx electron-builder --win   }
  "all"   { bunx electron-builder --linux --win }
}
Pop-Location

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  Build complete!"                         -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "Artifacts:"
Get-ChildItem -Path "front\dist" -ErrorAction SilentlyContinue | Format-Table Name, Length -AutoSize

Pop-Location
