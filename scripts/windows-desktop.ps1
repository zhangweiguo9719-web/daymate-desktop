param(
  [ValidateSet("dev", "build", "check")]
  [string]$Mode = "dev"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $projectRoot
$dataRoot = Join-Path $workspaceRoot "data"
$localCargo = Join-Path $workspaceRoot ".toolchain\cargo"
$localRustup = Join-Path $workspaceRoot ".toolchain\rustup"

if (Test-Path (Join-Path $localCargo "bin\cargo.exe")) {
  $env:CARGO_HOME = $localCargo
  $env:RUSTUP_HOME = $localRustup
  $env:Path = "$(Join-Path $localCargo 'bin');$env:Path"
}

$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vswhere)) { throw "Visual Studio Installer was not found. Install Desktop development with C++." }
$visualStudio = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
if (-not $visualStudio) { throw "Visual Studio C++ Build Tools were not found." }
$vcvars = Join-Path $visualStudio "VC\Auxiliary\Build\vcvars64.bat"
$msvcLib = Get-ChildItem (Join-Path $visualStudio "VC\Tools\MSVC") -Directory | Sort-Object Name -Descending | Select-Object -First 1 | ForEach-Object { Join-Path $_.FullName "lib\x64" }

$sdkRoot = "${env:ProgramFiles(x86)}\Windows Kits\10\Lib"
$sdk = Get-ChildItem $sdkRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Where-Object { Test-Path (Join-Path $_.FullName "um\x64\kernel32.lib") } | Select-Object -First 1
if (-not $sdk) { throw "Windows SDK Desktop C++ x64 libraries were not found." }

$lib = "$msvcLib;$($sdk.FullName)\ucrt\x64;$($sdk.FullName)\um\x64"
$action = switch ($Mode) {
  "dev" { "npm run tauri dev" }
  "build" { "npm run tauri build" }
  "check" { "cargo check --manifest-path src-tauri\Cargo.toml" }
}

$command = "call `"$vcvars`" && set `"CARGO_HOME=$env:CARGO_HOME`" && set `"RUSTUP_HOME=$env:RUSTUP_HOME`" && set `"DAYMATE_DATA_DIR=$dataRoot`" && set `"PATH=$env:Path`" && set `"LIB=$lib`" && $action"
Push-Location $projectRoot
try { cmd.exe /d /c $command } finally { Pop-Location }
