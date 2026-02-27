[CmdletBinding()]
param(
  [switch]$DryRun,
  [int]$RetryCount = 3,
  [int]$RetryDelaySeconds = 2
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Step {
  param(
    [Parameter(Mandatory)][string]$Message,
    [ConsoleColor]$Color = [ConsoleColor]::Cyan
  )

  Write-Host $Message -ForegroundColor $Color
}

function Git {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & git.exe @Args 2>&1
}

function Format-Args {
  param([Parameter(Mandatory)][string[]]$Args)

  return ($Args | ForEach-Object {
      if ($_ -match "\s") { '"{0}"' -f $_ } else { $_ }
    }) -join " "
}

function Invoke-Git {
  param(
    [Parameter(Mandatory)][string[]]$Args,
    [switch]$AllowFailure
  )

  $display = "git {0}" -f (Format-Args -Args $Args)
  $isMutating = $false
  if ($Args -contains "worktree" -and ($Args -contains "remove" -or $Args -contains "prune")) {
    $isMutating = $true
  }

  if ($DryRun -and $isMutating) {
    Write-Host ("[DRYRUN] {0}" -f $display) -ForegroundColor DarkGray
    return [pscustomobject]@{
      ExitCode = 0
      Lines    = @()
      Text     = ""
      Display  = $display
    }
  }

  $lines = @(Git @Args)
  $exitCode = $LASTEXITCODE
  if (-not $AllowFailure -and $exitCode -ne 0) {
    throw ("Command failed ({0}): {1}`n{2}" -f $exitCode, $display, ($lines -join "`n"))
  }

  return [pscustomobject]@{
    ExitCode = $exitCode
    Lines    = $lines
    Text     = $lines -join "`n"
    Display  = $display
  }
}

function Normalize-PathKey {
  param([Parameter(Mandatory)][string]$PathText)

  try {
    return ([System.IO.Path]::GetFullPath($PathText)).TrimEnd("\").ToLowerInvariant()
  }
  catch {
    return $PathText.TrimEnd("\").ToLowerInvariant()
  }
}

function Resolve-RepoRoot {
  param([Parameter(Mandatory)][string]$StartPath)

  $seedPaths = @($StartPath, $PSScriptRoot) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
  foreach ($seed in $seedPaths) {
    $cursor = $seed
    while (-not [string]::IsNullOrWhiteSpace($cursor)) {
      $probe = Invoke-Git -Args @("-C", $cursor, "rev-parse", "--show-toplevel") -AllowFailure
      if ($probe.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($probe.Text.Trim())) {
        return (Resolve-Path -LiteralPath $probe.Text.Trim()).Path
      }

      $parent = Split-Path -Parent $cursor
      if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $cursor) {
        break
      }
      $cursor = $parent
    }
  }

  throw "Unable to locate repository root from current directory or script directory."
}

function Get-WorktreeEntries {
  param([Parameter(Mandatory)][string]$RepoRoot)

  $res = Invoke-Git -Args @("-C", $RepoRoot, "worktree", "list", "--porcelain")
  $items = New-Object System.Collections.Generic.List[object]
  $current = [ordered]@{}
  $lines = @($res.Text -split "`r?`n")
  $lines += ""

  foreach ($raw in $lines) {
    $line = $raw.TrimEnd()
    if ([string]::IsNullOrWhiteSpace($line)) {
      if ($current.Contains("Path")) {
        $items.Add([pscustomobject]@{
            Path      = $current.Path
            PathKey   = Normalize-PathKey -PathText $current.Path
            BranchRef = if ($current.Contains("BranchRef")) { $current.BranchRef } else { $null }
            Branch    = if ($current.Contains("Branch")) { $current.Branch } else { $null }
            Detached  = [bool]($current.Contains("Detached") -and $current.Detached)
            Bare      = [bool]($current.Contains("Bare") -and $current.Bare)
          })
      }
      $current = [ordered]@{}
      continue
    }

    if ($line -match "^worktree (.+)$") {
      $pathText = $Matches[1]
      try {
        $pathText = (Resolve-Path -LiteralPath $pathText -ErrorAction Stop).Path
      }
      catch {
        $pathText = [System.IO.Path]::GetFullPath($pathText)
      }
      $current.Path = $pathText.TrimEnd("\")
      continue
    }

    if ($line -match "^branch (.+)$") {
      $branchRef = $Matches[1]
      $current.BranchRef = $branchRef
      if ($branchRef -match "^refs/heads/(.+)$") {
        $current.Branch = $Matches[1]
      }
      else {
        $current.Branch = $branchRef
      }
      continue
    }

    if ($line -eq "detached") {
      $current.Detached = $true
      continue
    }

    if ($line -eq "bare") {
      $current.Bare = $true
      continue
    }
  }

  return $items
}

function Select-MainWorktree {
  param(
    [Parameter(Mandatory)][object[]]$Entries,
    [Parameter(Mandatory)][string]$RepoRoot
  )

  $repoRootKey = Normalize-PathKey -PathText $RepoRoot
  $mainCandidates = @($Entries | Where-Object { $_.Branch -eq "main" })
  if ($mainCandidates.Count -gt 0) {
    $exactRepo = $mainCandidates | Where-Object { $_.PathKey -eq $repoRootKey } | Select-Object -First 1
    if ($null -ne $exactRepo) { return $exactRepo }
    return ($mainCandidates | Sort-Object { $_.Path.Length } | Select-Object -First 1)
  }

  $rootCandidate = $Entries | Where-Object { $_.PathKey -eq $repoRootKey } | Select-Object -First 1
  if ($null -ne $rootCandidate) { return $rootCandidate }

  $gitDirCandidate = $Entries | Where-Object { Test-Path -LiteralPath (Join-Path $_.Path ".git") -PathType Container } | Select-Object -First 1
  if ($null -ne $gitDirCandidate) { return $gitDirCandidate }

  return ($Entries | Sort-Object { $_.Path.Length } | Select-Object -First 1)
}

function Remove-DirectoryWithRetry {
  param(
    [Parameter(Mandatory)][string]$PathToRemove
  )

  if (-not (Test-Path -LiteralPath $PathToRemove -PathType Container)) {
    return $true
  }

  for ($attempt = 1; $attempt -le $RetryCount; $attempt++) {
    try {
      if ($DryRun) {
        Write-Host ("[DRYRUN] Remove-Item -LiteralPath '{0}' -Recurse -Force" -f $PathToRemove) -ForegroundColor DarkGray
        return $true
      }

      Remove-Item -LiteralPath $PathToRemove -Recurse -Force -ErrorAction Stop
      return $true
    }
    catch {
      if ($attempt -lt $RetryCount) {
        Write-Host ("Retry {0}/{1} while removing '{2}': {3}" -f $attempt, $RetryCount, $PathToRemove, $_.Exception.Message) -ForegroundColor Yellow
        Start-Sleep -Seconds $RetryDelaySeconds
      }
      else {
        Write-Host ("Failed to remove '{0}' after {1} attempts." -f $PathToRemove, $RetryCount) -ForegroundColor Red
        Write-Host "Remediation:" -ForegroundColor Yellow
        Write-Host ("  1) Close VS Code / Explorer windows using: {0}" -f $PathToRemove) -ForegroundColor Yellow
        Write-Host "  2) Retry this same script command." -ForegroundColor Yellow
        $handle = Get-Command handle.exe -ErrorAction SilentlyContinue
        if ($null -ne $handle) {
          Write-Host ("  3) Optional lock probe: handle.exe ""{0}""" -f $PathToRemove) -ForegroundColor Yellow
        }
        return $false
      }
    }
  }

  return $false
}

$repoRoot = Resolve-RepoRoot -StartPath (Get-Location).Path
Set-Location -LiteralPath $repoRoot

Write-Step -Message ("Repository root: {0}" -f $repoRoot)

$entries = @(Get-WorktreeEntries -RepoRoot $repoRoot)
if ($entries.Count -eq 0) {
  throw "git worktree list returned no entries."
}

$mainWorktree = Select-MainWorktree -Entries $entries -RepoRoot $repoRoot
if ($null -eq $mainWorktree) {
  throw "Unable to determine main worktree."
}

Write-Step -Message ("Main worktree: {0}" -f $mainWorktree.Path) -Color Green

$removed = New-Object System.Collections.Generic.List[string]
$metadataOnly = New-Object System.Collections.Generic.List[string]
$skipped = New-Object System.Collections.Generic.List[string]
$failed = New-Object System.Collections.Generic.List[string]

$total = $entries.Count
$index = 0
foreach ($entry in $entries) {
  $index++
  $percent = [int](($index / [Math]::Max(1, $total)) * 100)
  Write-Progress -Activity "Cleaning git worktrees" -Status ("{0}" -f $entry.Path) -PercentComplete $percent

  if ($entry.PathKey -eq $mainWorktree.PathKey) {
    $skipped.Add($entry.Path)
    continue
  }

  $gitMarker = Join-Path $entry.Path ".git"
  $isGitFile = Test-Path -LiteralPath $gitMarker -PathType Leaf
  $isGitDir = Test-Path -LiteralPath $gitMarker -PathType Container
  $pathExists = Test-Path -LiteralPath $entry.Path -PathType Container

  if ($pathExists -and $isGitDir -and -not $isGitFile) {
    Write-Host ("Skipping unsafe directory (looks like full repo): {0}" -f $entry.Path) -ForegroundColor Yellow
    $skipped.Add($entry.Path)
    continue
  }

  Write-Step -Message ("Removing worktree: {0}" -f $entry.Path) -Color DarkYellow
  $removeResult = Invoke-Git -Args @("-C", $repoRoot, "worktree", "remove", "--force", $entry.Path) -AllowFailure
  if ($removeResult.ExitCode -ne 0) {
    Write-Host ("git worktree remove returned exit {0} for {1}" -f $removeResult.ExitCode, $entry.Path) -ForegroundColor Yellow
    $failed.Add($entry.Path)
    continue
  }

  if ($pathExists -and -not $isGitFile) {
    Write-Host ("Metadata removed, but directory was not deleted (missing worktree .git file): {0}" -f $entry.Path) -ForegroundColor Yellow
    $metadataOnly.Add($entry.Path)
    continue
  }

  $deleteSuccess = Remove-DirectoryWithRetry -PathToRemove $entry.Path
  if ($deleteSuccess) {
    $removed.Add($entry.Path)
  }
  else {
    $failed.Add($entry.Path)
  }
}

Write-Progress -Activity "Cleaning git worktrees" -Completed

Write-Step -Message "Pruning stale worktree metadata..." -Color Cyan
[void](Invoke-Git -Args @("-C", $repoRoot, "worktree", "prune") -AllowFailure)

Write-Step -Message "Final worktree list:" -Color Cyan
$finalList = Invoke-Git -Args @("-C", $repoRoot, "worktree", "list") -AllowFailure
foreach ($line in $finalList.Lines) {
  if (-not [string]::IsNullOrWhiteSpace($line)) {
    Write-Host ("  {0}" -f $line) -ForegroundColor Gray
  }
}

Write-Step -Message ("Removed: {0}" -f $removed.Count) -Color Green
foreach ($item in $removed) { Write-Host ("  - {0}" -f $item) -ForegroundColor Green }

Write-Step -Message ("Metadata-only removals: {0}" -f $metadataOnly.Count) -Color Yellow
foreach ($item in $metadataOnly) { Write-Host ("  - {0}" -f $item) -ForegroundColor Yellow }

Write-Step -Message ("Skipped: {0}" -f $skipped.Count) -Color Yellow
foreach ($item in $skipped) { Write-Host ("  - {0}" -f $item) -ForegroundColor Yellow }

if ($failed.Count -gt 0) {
  Write-Step -Message ("Failed removals: {0}" -f $failed.Count) -Color Red
  foreach ($item in $failed) { Write-Host ("  - {0}" -f $item) -ForegroundColor Red }
  exit 1
}

Write-Step -Message "Worktree cleanup completed." -Color Green
exit 0
