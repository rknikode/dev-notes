<#
.SYNOPSIS
    Windows convenience wrapper for the notes generator.

.DESCRIPTION
    scripts/generate-notes.js is the single source of truth for building
    data/notes.json (used by GitHub Actions and locally). This wrapper just
    invokes it so both paths always produce identical output.

    Curated metadata already present in data/notes.json (title, description,
    tags, level, date) is preserved; only file-derived data is refreshed.

.EXAMPLE
    powershell -File scripts/generate-notes.ps1
#>

$ErrorActionPreference = 'Stop'

$script = Join-Path $PSScriptRoot 'generate-notes.js'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js is required. Install it from https://nodejs.org/ and try again.'
}

if (-not (Test-Path $script)) {
    Write-Error "Generator not found: $script"
}

node $script
exit $LASTEXITCODE
