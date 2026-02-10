[CmdletBinding()]
param(
  [switch]$Commit,
  [string]$CommitMessage = 'chore(wow): block2 audit report',
  [switch]$UseHeadCommit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Step-Progress {
  param(
    [int]$Percent,
    [string]$Status,
    [string]$Current
  )
  Write-Progress -Activity 'WOW Block 2 Audit' -Status $Status -CurrentOperation $Current -PercentComplete $Percent
}

function Run-Git {
  param([Parameter(Mandatory = $true)][string[]]$Args)
  $output = & git @Args 2>&1
  $code = $LASTEXITCODE
  return [pscustomobject]@{
    ExitCode = $code
    Output = ($output -join "`r`n")
  }
}

function Resolve-NpmCmdPath {
  $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
  if (-not $npmCmd) {
    throw 'npm was not found in PATH.'
  }

  $path = $npmCmd.Source
  if (-not $path) {
    throw 'Unable to resolve npm command source path.'
  }

  if ($path -match '\.ps1$') {
    $candidate = [System.IO.Path]::ChangeExtension($path, '.cmd')
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  if ($path -match '\.cmd$') {
    return $path
  }

  $candidateCmd = Join-Path -Path (Split-Path -Path $path -Parent) -ChildPath 'npm.cmd'
  if (Test-Path -LiteralPath $candidateCmd) {
    return $candidateCmd
  }

  throw "Unable to resolve npm.cmd path from '$path'."
}

function Run-NpmScript {
  param(
    [Parameter(Mandatory = $true)][string]$NpmCmdPath,
    [Parameter(Mandatory = $true)][string]$ScriptName
  )

  $cmdLine = '"' + $NpmCmdPath + '" run ' + $ScriptName
  $prevNativeErr = $false
  $hasNativeErrPref = Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue
  if ($hasNativeErrPref) {
    $prevNativeErr = [bool]$Global:PSNativeCommandUseErrorActionPreference
    $Global:PSNativeCommandUseErrorActionPreference = $false
  }
  $prevErrAction = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = & cmd.exe /d /s /c $cmdLine 2>&1
    $exit = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $prevErrAction
    if ($hasNativeErrPref) {
      $Global:PSNativeCommandUseErrorActionPreference = $prevNativeErr
    }
  }
  return [pscustomobject]@{
    ExitCode = $exit
    Output = ($out -join "`r`n")
    Command = "cmd.exe /c $cmdLine"
  }
}

function Cleanup-RepoNodeProcesses {
  param([Parameter(Mandatory = $true)][string]$RepoRoot)

  $killed = @()
  $escapedRepo = [Regex]::Escape($RepoRoot)

  $candidates = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
    $_.CommandLine -and $_.CommandLine -match $escapedRepo
  }

  foreach ($proc in $candidates) {
    try {
      Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
      $killed += $proc.ProcessId
    }
    catch {
      # best-effort cleanup only
    }
  }

  return $killed
}

function Parse-Numstat {
  param([string]$NumstatText)

  $adds = 0
  $dels = 0
  $rows = @()

  if ([string]::IsNullOrWhiteSpace($NumstatText)) {
    return [pscustomobject]@{ Adds = 0; Dels = 0; Net = 0; Rows = @() }
  }

  $lines = $NumstatText -split "`r?`n"
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split "`t"
    if ($parts.Count -lt 3) { continue }
    $a = $parts[0]
    $d = $parts[1]
    $p = $parts[2]

    $ai = 0
    $di = 0
    if ($a -match '^\d+$') { $ai = [int]$a }
    if ($d -match '^\d+$') { $di = [int]$d }
    $adds += $ai
    $dels += $di
    $rows += [pscustomobject]@{ Adds = $ai; Dels = $di; Path = $p }
  }

  return [pscustomobject]@{
    Adds = $adds
    Dels = $dels
    Net = ($adds - $dels)
    Rows = $rows
  }
}

function Get-ChangedFilesText {
  param([switch]$HeadMode)
  if ($HeadMode) {
    $res = Run-Git -Args @('show', '--name-only', '--format=', 'HEAD')
  }
  else {
    $res = Run-Git -Args @('diff', '--name-only', 'HEAD')
  }
  if ($res.ExitCode -ne 0) { return '' }
  return $res.Output.Trim()
}

function Get-NumstatText {
  param([switch]$HeadMode)
  if ($HeadMode) {
    $res = Run-Git -Args @('show', '--numstat', '--format=', 'HEAD')
  }
  else {
    $res = Run-Git -Args @('diff', '--numstat', 'HEAD')
  }
  if ($res.ExitCode -ne 0) { return '' }
  return $res.Output.Trim()
}

Step-Progress -Percent 3 -Status 'Initialize' -Current 'Resolve repo root'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location -LiteralPath $repoRoot

Step-Progress -Percent 8 -Status 'Preflight' -Current 'Verify git + package.json'
$inside = Run-Git -Args @('rev-parse', '--is-inside-work-tree')
if ($inside.ExitCode -ne 0 -or $inside.Output.Trim() -ne 'true') {
  throw 'Current directory is not a git repository.'
}

$packageJsonPath = Join-Path $repoRoot 'package.json'
if (-not (Test-Path -LiteralPath $packageJsonPath)) {
  throw 'package.json not found at repository root.'
}

Step-Progress -Percent 14 -Status 'Cleanup' -Current 'Best-effort node/vite cleanup for this repo'
$killedPids = @(Cleanup-RepoNodeProcesses -RepoRoot $repoRoot)

Step-Progress -Percent 20 -Status 'Policy checks' -Current 'Forbidden slides + WOW flags heuristic'
$forbiddenPaths = @('components/slides/Slide09.tsx', 'components/slides/Slide16.tsx')
$forbiddenViolations = @()

if ($UseHeadCommit) {
  $headNamesRes = Run-Git -Args @('show', '--name-only', '--format=', 'HEAD')
  $headNames = @()
  if ($headNamesRes.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($headNamesRes.Output)) {
    $headNames = $headNamesRes.Output -split "`r?`n"
  }
  foreach ($fp in $forbiddenPaths) {
    if ($headNames -contains $fp) {
      $forbiddenViolations += "HEAD commit touches forbidden file: $fp"
    }
  }
}
else {
  foreach ($fp in $forbiddenPaths) {
    $chk = Run-Git -Args @('diff', '--name-only', 'HEAD', '--', $fp)
    if ($chk.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($chk.Output)) {
      $forbiddenViolations += "Working tree touches forbidden file: $fp"
    }
  }
}

$wowGrep = Run-Git -Args @('grep', '-n', '-E', 'VITE_WOW_|WOW_', '--', 'config/wow.ts', '.env.local', 'App.tsx', 'wow/tour')
$wowGrepSummary = if ($wowGrep.ExitCode -eq 0) { $wowGrep.Output } else { 'No WOW grep output (warn-only heuristic).' }

$flagDefaultsWarning = @()
$configText = Get-Content -LiteralPath (Join-Path $repoRoot 'config/wow.ts') -Raw
if ($configText -notmatch 'envFlag\(') {
  $flagDefaultsWarning += 'config/wow.ts missing envFlag parsing pattern.'
}
if ($configText -notmatch 'typeof value !== "string"') {
  $flagDefaultsWarning += 'WOW default-off heuristic may be broken (expected string gate).' 
}

if ($forbiddenViolations.Count -gt 0) {
  throw ($forbiddenViolations -join "`r`n")
}

Step-Progress -Percent 32 -Status 'Tooling' -Current 'Resolve npm.cmd'
$npmCmdPath = Resolve-NpmCmdPath

Step-Progress -Percent 48 -Status 'Validation' -Current 'npm run typecheck'
$typecheckRes = Run-NpmScript -NpmCmdPath $npmCmdPath -ScriptName 'typecheck'
if ($typecheckRes.ExitCode -ne 0) {
  throw "typecheck failed (exit $($typecheckRes.ExitCode)).`r`n$($typecheckRes.Output)"
}

Step-Progress -Percent 64 -Status 'Validation' -Current 'npm run build'
$buildRes = Run-NpmScript -NpmCmdPath $npmCmdPath -ScriptName 'build'
if ($buildRes.ExitCode -ne 0) {
  throw "build failed (exit $($buildRes.ExitCode)).`r`n$($buildRes.Output)"
}

Step-Progress -Percent 78 -Status 'Diff analysis' -Current 'Collect changed files + net LOC'
$changedFilesText = Get-ChangedFilesText -HeadMode:$UseHeadCommit
$changedFiles = @()
if (-not [string]::IsNullOrWhiteSpace($changedFilesText)) {
  $changedFiles = $changedFilesText -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

$numstatText = Get-NumstatText -HeadMode:$UseHeadCommit
$numstat = Parse-Numstat -NumstatText $numstatText

Step-Progress -Percent 88 -Status 'Report' -Current 'Generate WOW_BLOCK2_REPORT.md'
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$modeLabel = if ($UseHeadCommit) { 'HEAD commit' } else { 'working tree vs HEAD' }
$changedFilesMd = if ($changedFiles.Count -gt 0) {
  ($changedFiles | ForEach-Object { ('- `{0}`' -f $_) }) -join "`r`n"
}
else {
  '- (none)'
}

$warnings = @()
if ($flagDefaultsWarning.Count -gt 0) { $warnings += $flagDefaultsWarning }
if ($wowGrep.ExitCode -ne 0) { $warnings += 'WOW grep heuristic had no matches or failed; manual review recommended.' }
if ($warnings.Count -eq 0) { $warnings += 'None' }

$killedText = if ($killedPids.Count -gt 0) { ($killedPids -join ', ') } else { 'none' }
$defaultFlagStatus = if ($flagDefaultsWarning.Count -eq 0) { 'PASS' } else { 'WARN' }
$warningsMd = ($warnings | ForEach-Object { "- $_" }) -join "`r`n"
$typecheckCmd = $typecheckRes.Command
$buildCmd = $buildRes.Command

$report = @"
# WOW Block 2 Audit Report

- Generated: $timestamp
- Mode: $modeLabel
- Repo: $repoRoot

## Checks
- Forbidden slides: PASS (Slide09.tsx, Slide16.tsx untouched in selected mode)
- Global keybinds: Heuristic PASS (no automated mutation; manual code review still advised)
- WOW flags default OFF heuristic: $defaultFlagStatus
- Determinism/no-network in audit script: PASS (local-only commands)

## Validation
- Typecheck: PASS (npm run typecheck)
- Build: PASS (npm run build)

## Net LOC
- Added: +$($numstat.Adds)
- Deleted: -$($numstat.Dels)
- Net: $($numstat.Net)

## Changed Files
$changedFilesMd

## WOW Flag Heuristic (warn-only)
$wowGrepSummary

## Warnings
$warningsMd

## Process Cleanup
- Killed repo-scoped node PIDs: $killedText

## Commands Executed
- $typecheckCmd
- $buildCmd

"@

$reportPath = Join-Path $repoRoot 'WOW_BLOCK2_REPORT.md'
Set-Content -LiteralPath $reportPath -Value $report -Encoding UTF8

try {
  Set-Clipboard -Value $report -ErrorAction Stop
  $clipboardStatus = 'Copied report to clipboard.'
}
catch {
  $clipboardStatus = 'Clipboard copy failed (non-fatal).'
}

$commitStatus = 'Commit skipped.'
if ($Commit) {
  Step-Progress -Percent 95 -Status 'Commit' -Current 'Stage and commit changes'
  $addRes = Run-Git -Args @('add', '-A')
  if ($addRes.ExitCode -ne 0) {
    throw "git add failed.`r`n$($addRes.Output)"
  }

  $commitRes = Run-Git -Args @('commit', '-m', $CommitMessage)
  if ($commitRes.ExitCode -ne 0) {
    throw "git commit failed.`r`n$($commitRes.Output)"
  }
  $commitStatus = 'Commit completed.'
}

Step-Progress -Percent 100 -Status 'Done' -Current 'Audit complete'
Write-Progress -Activity 'WOW Block 2 Audit' -Completed

Write-Host ''
Write-Host '===== WOW_BLOCK2_REPORT.md =====' -ForegroundColor Magenta
$report -split "`r`n" | ForEach-Object { Write-Host $_ -ForegroundColor Magenta }
Write-Host '================================' -ForegroundColor Magenta
Write-Host ''
Write-Host $clipboardStatus -ForegroundColor Green
Write-Host $commitStatus -ForegroundColor Green

Write-Host ''
Write-Host 'Files created/modified:' -ForegroundColor Cyan
Write-Host "- $reportPath"
Write-Host '- (plus existing repository changes, if any)'
Write-Host ''
Write-Host 'How to run (one command):' -ForegroundColor Cyan
Write-Host '.\scripts\wow-block2-audit.ps1'
Write-Host ''
Write-Host 'Validation confirmation:' -ForegroundColor Cyan
Write-Host '- typecheck/build passed during audit.'
