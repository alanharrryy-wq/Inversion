[CmdletBinding()]
param(
  [string]$TargetBranch = "",
  [string]$Remote = "origin",
  [string]$MainBranch = "main",
  [string[]]$TakeTheirsPaths = @(),
  [switch]$DryRun
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
  $mutatingTokens = @("checkout", "fetch", "merge", "commit", "push", "add", "reset", "rebase", "cherry-pick")
  $isMutating = $false
  foreach ($token in $mutatingTokens) {
    if ($Args -contains $token) {
      $isMutating = $true
      break
    }
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

function Normalize-RepoPath {
  param([Parameter(Mandatory)][string]$PathText)
  return $PathText.Replace("\", "/").Trim()
}

function Test-MatchesTakeTheirs {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [Parameter(Mandatory)][string[]]$Patterns
  )

  $normalizedFile = Normalize-RepoPath -PathText $FilePath
  foreach ($pattern in $Patterns) {
    if ([string]::IsNullOrWhiteSpace($pattern)) {
      continue
    }

    $normalizedPattern = Normalize-RepoPath -PathText $pattern
    if ($normalizedFile -eq $normalizedPattern -or $normalizedFile -like $normalizedPattern) {
      return $true
    }
  }

  return $false
}

$repoRoot = Resolve-RepoRoot -StartPath (Get-Location).Path
Set-Location -LiteralPath $repoRoot
Write-Step -Message ("Repository root: {0}" -f $repoRoot)

$currentBranchRes = Invoke-Git -Args @("-C", $repoRoot, "rev-parse", "--abbrev-ref", "HEAD")
$currentBranch = $currentBranchRes.Text.Trim()
if ([string]::IsNullOrWhiteSpace($currentBranch) -or $currentBranch -eq "HEAD") {
  throw "Current checkout is detached. Provide -TargetBranch explicitly."
}

if ([string]::IsNullOrWhiteSpace($TargetBranch)) {
  $TargetBranch = $currentBranch
}

Write-Step -Message ("Target branch: {0}" -f $TargetBranch) -Color Green
if ($TakeTheirsPaths.Count -eq 0) {
  Write-Host "Take-theirs list is empty. Only clean merges (or conflicts resolved manually) will proceed." -ForegroundColor Yellow
}

$dirty = Invoke-Git -Args @("-C", $repoRoot, "status", "--porcelain")
if (-not [string]::IsNullOrWhiteSpace($dirty.Text)) {
  if ($DryRun) {
    Write-Host "Working tree is not clean. Continuing because -DryRun is active." -ForegroundColor Yellow
  }
  else {
    throw "Working tree is not clean. Commit/stash changes before running this script."
  }
}

Write-Progress -Activity "Merge from main" -Status "Checkout target branch" -PercentComplete 10
if ($currentBranch -ne $TargetBranch) {
  [void](Invoke-Git -Args @("-C", $repoRoot, "checkout", $TargetBranch))
}

Write-Progress -Activity "Merge from main" -Status "Fetch main from origin" -PercentComplete 30
[void](Invoke-Git -Args @("-C", $repoRoot, "fetch", $Remote, $MainBranch, "--prune"))

$mergeRef = "{0}/{1}" -f $Remote, $MainBranch
Write-Progress -Activity "Merge from main" -Status ("Merging {0}" -f $mergeRef) -PercentComplete 50
$mergeResult = Invoke-Git -Args @("-C", $repoRoot, "merge", "--no-ff", "--no-edit", $mergeRef) -AllowFailure

$resolvedWithTheirs = New-Object System.Collections.Generic.List[string]
if ($mergeResult.ExitCode -ne 0) {
  Write-Host "Merge reported conflicts. Applying take-theirs policy for configured files." -ForegroundColor Yellow
  $conflictsRes = Invoke-Git -Args @("-C", $repoRoot, "diff", "--name-only", "--diff-filter=U") -AllowFailure
  $conflicts = @($conflictsRes.Lines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($conflicts.Count -eq 0) {
    throw ("Merge failed without conflict file list. Output:`n{0}" -f $mergeResult.Text)
  }

  $unresolved = New-Object System.Collections.Generic.List[string]
  foreach ($file in $conflicts) {
    if (Test-MatchesTakeTheirs -FilePath $file -Patterns $TakeTheirsPaths) {
      Write-Host ("Taking THEIRS for: {0}" -f $file) -ForegroundColor DarkYellow
      [void](Invoke-Git -Args @("-C", $repoRoot, "checkout", "--theirs", "--", $file))
      [void](Invoke-Git -Args @("-C", $repoRoot, "add", "--", $file))
      $resolvedWithTheirs.Add($file)
    }
    else {
      $unresolved.Add($file)
    }
  }

  $remainingRes = Invoke-Git -Args @("-C", $repoRoot, "diff", "--name-only", "--diff-filter=U") -AllowFailure
  $remaining = @($remainingRes.Lines | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($remaining.Count -gt 0 -or $unresolved.Count -gt 0) {
    [void](Invoke-Git -Args @("-C", $repoRoot, "merge", "--abort") -AllowFailure)
    $allUnresolved = @($remaining + $unresolved) | Select-Object -Unique
    throw ("Unresolved conflicts remain. Merge aborted.`n{0}" -f ($allUnresolved -join "`n"))
  }

  if ($DryRun) {
    Write-Host "[DRYRUN] Skipping merge commit after conflict resolution." -ForegroundColor DarkGray
  }
  else {
    $message = "merge(main): {0} into {1} (take theirs: {2})" -f $mergeRef, $TargetBranch, ([Math]::Max(1, $resolvedWithTheirs.Count))
    [void](Invoke-Git -Args @("-C", $repoRoot, "commit", "-m", $message))
  }
}

Write-Progress -Activity "Merge from main" -Status "Push target branch" -PercentComplete 85
[void](Invoke-Git -Args @("-C", $repoRoot, "push", $Remote, $TargetBranch))

Write-Progress -Activity "Merge from main" -Completed
Write-Step -Message "Merge flow completed." -Color Green
if ($resolvedWithTheirs.Count -gt 0) {
  Write-Step -Message "Files resolved with THEIRS:" -Color DarkYellow
  foreach ($item in $resolvedWithTheirs) {
    Write-Host ("  - {0}" -f $item) -ForegroundColor DarkYellow
  }
}
exit 0
