[CmdletBinding()]
param(
  [string]$BaseBranch = "main",
  [string]$HeadPrefix = "codex-",
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

function Resolve-RepoRoot {
  param([Parameter(Mandatory)][string]$StartPath)

  $cursor = $StartPath
  while (-not [string]::IsNullOrWhiteSpace($cursor)) {
    $probe = & git.exe -C $cursor rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace(($probe -join "`n").Trim())) {
      return (Resolve-Path -LiteralPath (($probe -join "`n").Trim())).Path
    }

    $parent = Split-Path -Parent $cursor
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $cursor) {
      break
    }
    $cursor = $parent
  }

  throw "Unable to locate repository root from current directory."
}

function Print-FallbackCommandBlock {
  param(
    [Parameter(Mandatory)][string]$BaseBranchParam,
    [Parameter(Mandatory)][string]$HeadPrefixParam
  )

  Write-Host "Optional fallback command block:" -ForegroundColor Yellow
  Write-Host @"
`$states = @('CLEAN','HAS_HOOKS','UNSTABLE')
gh auth status -h github.com
gh pr list --state open --base $BaseBranchParam --json number,headRefName,mergeStateStatus,isDraft | ConvertFrom-Json |
  Where-Object { -not `$_.isDraft -and `$_.headRefName -like '$HeadPrefixParam*' -and `$states -contains `$_.mergeStateStatus } |
  ForEach-Object { gh pr merge `$_.number --merge --delete-branch }
"@ -ForegroundColor DarkGray
}

$repoRoot = Resolve-RepoRoot -StartPath (Get-Location).Path
Set-Location -LiteralPath $repoRoot
Write-Step -Message ("Repository root: {0}" -f $repoRoot)

$gh = Get-Command gh -ErrorAction SilentlyContinue
if ($null -eq $gh) {
  Write-Step -Message "GitHub CLI (gh) is not installed. Skipping auto-merge." -Color Yellow
  Print-FallbackCommandBlock -BaseBranchParam $BaseBranch -HeadPrefixParam $HeadPrefix
  exit 0
}

& gh auth status -h github.com *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Step -Message "GitHub CLI is not authenticated. Skipping auto-merge." -Color Yellow
  Print-FallbackCommandBlock -BaseBranchParam $BaseBranch -HeadPrefixParam $HeadPrefix
  exit 0
}

$json = & gh pr list --state open --base $BaseBranch --json number,title,headRefName,mergeStateStatus,isDraft,url
if ($LASTEXITCODE -ne 0) {
  throw "Failed to list PRs via gh."
}

$prs = @()
if (-not [string]::IsNullOrWhiteSpace($json)) {
  $prs = @($json | ConvertFrom-Json)
}

$mergeableStates = @("CLEAN", "HAS_HOOKS", "UNSTABLE")
$candidates = @(
  $prs | Where-Object {
    -not $_.isDraft -and
    $_.headRefName -like ("{0}*" -f $HeadPrefix) -and
    $mergeableStates -contains $_.mergeStateStatus
  }
)

Write-Step -Message ("Open PRs found: {0}" -f $prs.Count)
Write-Step -Message ("Mergeable candidates ({0}*): {1}" -f $HeadPrefix, $candidates.Count) -Color Green

$merged = 0
$skipped = 0
$total = [Math]::Max(1, $candidates.Count)
$i = 0
foreach ($pr in $candidates) {
  $i++
  $percent = [int](($i / $total) * 100)
  Write-Progress -Activity "Auto-merging PRs" -Status ("PR #{0} {1}" -f $pr.number, $pr.headRefName) -PercentComplete $percent

  if ($DryRun) {
    Write-Host ("[DRYRUN] gh pr merge {0} --merge --delete-branch" -f $pr.number) -ForegroundColor DarkGray
    $merged++
    continue
  }

  & gh pr merge $pr.number --merge --delete-branch
  if ($LASTEXITCODE -eq 0) {
    $merged++
    Write-Host ("Merged PR #{0}: {1}" -f $pr.number, $pr.url) -ForegroundColor Green
  }
  else {
    $skipped++
    Write-Host ("Skipped PR #{0}: merge command failed." -f $pr.number) -ForegroundColor Yellow
  }
}

Write-Progress -Activity "Auto-merging PRs" -Completed
Write-Step -Message ("Merged: {0} | Skipped: {1}" -f $merged, $skipped) -Color Green
exit 0
