#requires -version 7.0
<#
INVERSION: Boot 4x VS Code + 4x Worktrees

Creates/repairs 4 deterministic worktrees next to the repository, writes
CODEX_PROMPT_CURRENT.txt stub files, and opens one VS Code window per worktree.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:RetryDelaysMs = @(500, 1500, 3000)

function Write-StructuredLog {
  param(
    [ValidateSet("INFO", "WARN", "ERROR", "CHECKPOINT")]
    [string]$Level = "INFO",
    [Parameter(Mandatory)]
    [string]$Message
  )

  $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
  $line = "[{0}][{1}] {2}" -f $timestamp, $Level, $Message

  switch ($Level) {
    "CHECKPOINT" { Write-Host $line -ForegroundColor Magenta }
    "WARN" { Write-Host $line -ForegroundColor Yellow }
    "ERROR" { Write-Host $line -ForegroundColor Red }
    default { Write-Host $line }
  }
}

function New-Or-Ensure-Dir {
  param([Parameter(Mandatory)][string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Format-CommandDisplay {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [string[]]$Arguments = @()
  )

  $renderedArgs = @()
  foreach ($arg in $Arguments) {
    if ($null -eq $arg -or $arg -eq "") {
      $renderedArgs += '""'
      continue
    }

    if ($arg -match "[\s`"]") {
      $escaped = $arg.Replace('"', '\"')
      $renderedArgs += ('"{0}"' -f $escaped)
    }
    else {
      $renderedArgs += $arg
    }
  }

  $suffix = if ($renderedArgs.Count -gt 0) { " " + ($renderedArgs -join " ") } else { "" }
  return "{0}{1}" -f $FilePath, $suffix
}

function Resolve-ExecutablePath {
  param([Parameter(Mandatory)][string]$FilePath)

  $cmd = Get-Command -Name $FilePath -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $cmd -and $cmd.Source) {
    return $cmd.Source
  }

  return $FilePath
}

function Invoke-External {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [string[]]$Arguments = @(),
    [string]$WorkingDirectory = (Get-Location).Path,
    [switch]$AllowFailure,
    [switch]$NoWait
  )

  $resolvedExecutable = Resolve-ExecutablePath -FilePath $FilePath
  $displayCommand = Format-CommandDisplay -FilePath $FilePath -Arguments $Arguments

  if (-not (Test-Path -LiteralPath $WorkingDirectory -PathType Container)) {
    throw "Working directory does not exist: $WorkingDirectory"
  }

  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.WorkingDirectory = $WorkingDirectory
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardOutput = -not $NoWait
  $psi.RedirectStandardError = -not $NoWait
  $psi.FileName = $resolvedExecutable

  foreach ($arg in $Arguments) {
    [void]$psi.ArgumentList.Add($arg)
  }

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $psi

  try {
    [void]$process.Start()
  }
  catch {
    $startError = "Failed to start command.`nCommand: $displayCommand`nError: $($_.Exception.Message)"
    if ($AllowFailure) {
      Write-StructuredLog -Level "WARN" -Message $startError
      return [pscustomobject]@{
        Success    = $false
        ExitCode   = -1
        Command    = $displayCommand
        StdOut     = ""
        StdErr     = $startError
        ProcessId  = $null
        NonBlocking = [bool]$NoWait
      }
    }

    throw $startError
  }

  if ($NoWait) {
    return [pscustomobject]@{
      Success    = $true
      ExitCode   = $null
      Command    = $displayCommand
      StdOut     = ""
      StdErr     = ""
      ProcessId  = $process.Id
      NonBlocking = $true
    }
  }

  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  $exitCode = $process.ExitCode

  $result = [pscustomobject]@{
    Success    = ($exitCode -eq 0)
    ExitCode   = $exitCode
    Command    = $displayCommand
    StdOut     = $stdout
    StdErr     = $stderr
    ProcessId  = $process.Id
    NonBlocking = $false
  }

  if ($exitCode -ne 0) {
    $trimmedStdErr = ($stderr ?? "").Trim()
    $trimmedStdOut = ($stdout ?? "").Trim()
    $failureMessage = @(
      "External command failed."
      ("Command: {0}" -f $displayCommand)
      ("ExitCode: {0}" -f $exitCode)
      ("Stderr: {0}" -f $(if ($trimmedStdErr) { $trimmedStdErr } else { "<empty>" }))
      ("Stdout: {0}" -f $(if ($trimmedStdOut) { $trimmedStdOut } else { "<empty>" }))
    ) -join [Environment]::NewLine

    if ($AllowFailure) {
      Write-StructuredLog -Level "WARN" -Message $failureMessage
      return $result
    }

    throw $failureMessage
  }

  return $result
}

function Normalize-PathText {
  param(
    [Parameter(Mandatory)][string]$PathText,
    [string]$BasePath = ""
  )

  $candidate = $PathText.Replace("/", "\")
  if (-not [System.IO.Path]::IsPathRooted($candidate) -and $BasePath) {
    $candidate = Join-Path $BasePath $candidate
  }

  try {
    return [System.IO.Path]::GetFullPath($candidate).TrimEnd("\")
  }
  catch {
    return $candidate.TrimEnd("\")
  }
}

function Parse-WorktreePorcelain {
  param(
    [Parameter(Mandatory)][string]$PorcelainText,
    [Parameter(Mandatory)][string]$RepoRoot
  )

  $items = New-Object System.Collections.Generic.List[object]
  $current = [ordered]@{}
  $lines = @($PorcelainText -split "`r?`n")
  $lines += ""

  foreach ($lineRaw in $lines) {
    $line = $lineRaw.TrimEnd()
    if ([string]::IsNullOrWhiteSpace($line)) {
      if ($current.Contains("Path")) {
        $items.Add([pscustomobject]@{
          Path     = $current.Path
          Branch   = if ($current.Contains("Branch")) { $current.Branch } else { $null }
          Detached = [bool]($current.Contains("Detached") -and $current.Detached)
          Bare     = [bool]($current.Contains("Bare") -and $current.Bare)
        })
      }
      $current = [ordered]@{}
      continue
    }

    if ($line -match "^worktree (.+)$") {
      $current.Path = Normalize-PathText -PathText $Matches[1] -BasePath $RepoRoot
      continue
    }

    if ($line -match "^branch (.+)$") {
      $branchRef = $Matches[1]
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

  return $items.ToArray()
}

function Get-WorktreeInfo {
  param([Parameter(Mandatory)][string]$RepoRoot)

  $result = Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "worktree", "list", "--porcelain") -WorkingDirectory $RepoRoot
  return Parse-WorktreePorcelain -PorcelainText $result.StdOut -RepoRoot $RepoRoot
}

function Test-ValidWorktreePath {
  param(
    [Parameter(Mandatory)][string]$WorktreePath
  )

  if (-not (Test-Path -LiteralPath $WorktreePath -PathType Container)) {
    return $false
  }

  $gitMarker = Join-Path $WorktreePath ".git"
  if (-not (Test-Path -LiteralPath $gitMarker)) {
    return $false
  }

  $probeInside = Invoke-External -FilePath "git" -Arguments @("-C", $WorktreePath, "rev-parse", "--is-inside-work-tree") -WorkingDirectory $WorktreePath -AllowFailure
  if (-not $probeInside.Success) {
    return $false
  }

  if (($probeInside.StdOut ?? "").Trim().ToLowerInvariant() -ne "true") {
    return $false
  }

  $probeStatus = Invoke-External -FilePath "git" -Arguments @("-C", $WorktreePath, "status", "--short") -WorkingDirectory $WorktreePath -AllowFailure
  return $probeStatus.Success
}

function Test-BranchInUseElsewhere {
  param(
    [Parameter(Mandatory)][array]$WorktreeInfo,
    [Parameter(Mandatory)][string]$BranchName,
    [Parameter(Mandatory)][string]$TargetPath
  )

  foreach ($entry in $WorktreeInfo) {
    if ($null -eq $entry.Branch) {
      continue
    }
    if ($entry.Branch -eq $BranchName -and $entry.Path -ne $TargetPath) {
      return $true
    }
  }

  return $false
}

function Resolve-BranchForWorktree {
  param(
    [Parameter(Mandatory)][string]$RepoRoot,
    [Parameter(Mandatory)][array]$WorktreeInfo,
    [Parameter(Mandatory)][string]$PreferredBranch,
    [Parameter(Mandatory)][string]$TargetPath
  )

  if (-not (Test-BranchInUseElsewhere -WorktreeInfo $WorktreeInfo -BranchName $PreferredBranch -TargetPath $TargetPath)) {
    return $PreferredBranch
  }

  $shortHead = (Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "rev-parse", "--short", "HEAD") -WorkingDirectory $RepoRoot).StdOut.Trim()
  $candidates = New-Object System.Collections.Generic.List[string]
  $candidates.Add(("{0}-{1}" -f $PreferredBranch, $shortHead))
  for ($idx = 1; $idx -le 99; $idx++) {
    $candidates.Add(("{0}-alt{1}" -f $PreferredBranch, $idx))
  }

  foreach ($candidate in $candidates) {
    if (-not (Test-BranchInUseElsewhere -WorktreeInfo $WorktreeInfo -BranchName $candidate -TargetPath $TargetPath)) {
      Write-StructuredLog -Level "WARN" -Message ("Branch '{0}' is already checked out in another worktree. Using deterministic fallback branch '{1}'." -f $PreferredBranch, $candidate)
      return $candidate
    }
  }

  throw ("Unable to resolve a free deterministic branch name for preferred branch '{0}'." -f $PreferredBranch)
}

function Ensure-LocalBranchAtHead {
  param(
    [Parameter(Mandatory)][string]$RepoRoot,
    [Parameter(Mandatory)][string]$BranchName
  )

  $existing = (Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "branch", "--list", $BranchName) -WorkingDirectory $RepoRoot).StdOut.Trim()
  if ([string]::IsNullOrWhiteSpace($existing)) {
    Write-StructuredLog -Level "INFO" -Message ("Branch does not exist. Creating '{0}' at HEAD." -f $BranchName)
    [void](Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "branch", $BranchName, "HEAD") -WorkingDirectory $RepoRoot)
  }
  else {
    Write-StructuredLog -Level "INFO" -Message ("Branch exists: {0}" -f $BranchName)
  }
}

function Repair-InvalidWorktreeFolder {
  param(
    [Parameter(Mandatory)][string]$WorktreePath
  )

  if (-not (Test-Path -LiteralPath $WorktreePath -PathType Container)) {
    return
  }

  $attemptDelays = @(200, 600, 1200)
  $maxAttempts = $attemptDelays.Count

  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
      if (-not (Test-Path -LiteralPath $WorktreePath -PathType Container)) {
        return
      }

      $entries = @(Get-ChildItem -LiteralPath $WorktreePath -Force -ErrorAction SilentlyContinue)
      if ($entries.Count -gt 0) {
        $stamp = Get-Date -Format "yyyyMMdd_HHmmss_fff"
        $quarantinePath = "{0}.__broken__{1}_{2}" -f $WorktreePath, $stamp, $attempt
        Write-StructuredLog -Level "WARN" -Message ("Existing folder is not a valid worktree. Moving to quarantine: {0}" -f $quarantinePath)
        Move-Item -LiteralPath $WorktreePath -Destination $quarantinePath -Force
      }
      else {
        Write-StructuredLog -Level "WARN" -Message ("Existing folder is not a valid worktree but is empty. Keeping folder for reuse: {0}" -f $WorktreePath)
      }

      return
    }
    catch {
      if ($attempt -ge $maxAttempts) {
        throw
      }

      $delay = $attemptDelays[$attempt - 1]
      Write-StructuredLog -Level "WARN" -Message ("Failed to repair invalid folder (attempt {0}/{1}) at {2}. Retrying in {3}ms. Error: {4}" -f $attempt, $maxAttempts, $WorktreePath, $delay, $_.Exception.Message)
      Start-Sleep -Milliseconds $delay
    }
  }
}

function Ensure-Worktree {
  param(
    [Parameter(Mandatory)][string]$RepoRoot,
    [Parameter(Mandatory)][string]$WorktreePath,
    [Parameter(Mandatory)][string]$PreferredBranch
  )

  $normalizedTargetPath = Normalize-PathText -PathText $WorktreePath -BasePath $RepoRoot
  $targetParent = Split-Path -Parent $normalizedTargetPath
  New-Or-Ensure-Dir -Path $targetParent

  [void](Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "worktree", "prune") -WorkingDirectory $RepoRoot)
  $worktreeInfo = Get-WorktreeInfo -RepoRoot $RepoRoot

  if (Test-Path -LiteralPath $normalizedTargetPath -PathType Container) {
    if (Test-ValidWorktreePath -WorktreePath $normalizedTargetPath) {
      $existingBranch = (Invoke-External -FilePath "git" -Arguments @("-C", $normalizedTargetPath, "rev-parse", "--abbrev-ref", "HEAD") -WorkingDirectory $normalizedTargetPath).StdOut.Trim()
      Write-StructuredLog -Level "INFO" -Message ("Worktree already valid at {0} (branch: {1})." -f $normalizedTargetPath, $existingBranch)
      return [pscustomobject]@{
        Path         = $normalizedTargetPath
        Branch       = $existingBranch
        WasRecovered = $false
      }
    }

    Repair-InvalidWorktreeFolder -WorktreePath $normalizedTargetPath
  }

  $worktreeInfo = Get-WorktreeInfo -RepoRoot $RepoRoot
  $targetEntry = $worktreeInfo | Where-Object { $_.Path -eq $normalizedTargetPath } | Select-Object -First 1

  if ($null -ne $targetEntry -and -not (Test-Path -LiteralPath $normalizedTargetPath -PathType Container)) {
    Write-StructuredLog -Level "WARN" -Message ("Worktree is still registered but folder is missing. Pruning stale metadata for: {0}" -f $normalizedTargetPath)
    [void](Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "worktree", "prune") -WorkingDirectory $RepoRoot)
    $worktreeInfo = Get-WorktreeInfo -RepoRoot $RepoRoot
    $targetEntry = $worktreeInfo | Where-Object { $_.Path -eq $normalizedTargetPath } | Select-Object -First 1

    if ($null -ne $targetEntry) {
      [void](Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "worktree", "remove", "--force", $normalizedTargetPath) -WorkingDirectory $RepoRoot -AllowFailure)
      [void](Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "worktree", "prune") -WorkingDirectory $RepoRoot)
      $worktreeInfo = Get-WorktreeInfo -RepoRoot $RepoRoot
      $targetEntry = $worktreeInfo | Where-Object { $_.Path -eq $normalizedTargetPath } | Select-Object -First 1

      if ($null -ne $targetEntry) {
        throw ("Stale worktree metadata remains for path: {0}" -f $normalizedTargetPath)
      }
    }
  }

  $branchToUse = Resolve-BranchForWorktree -RepoRoot $RepoRoot -WorktreeInfo $worktreeInfo -PreferredBranch $PreferredBranch -TargetPath $normalizedTargetPath
  Ensure-LocalBranchAtHead -RepoRoot $RepoRoot -BranchName $branchToUse

  Write-StructuredLog -Level "CHECKPOINT" -Message ("Adding worktree: {0} -> {1}" -f $normalizedTargetPath, $branchToUse)
  [void](Invoke-External -FilePath "git" -Arguments @("-C", $RepoRoot, "worktree", "add", $normalizedTargetPath, $branchToUse) -WorkingDirectory $RepoRoot)

  if (-not (Test-Path -LiteralPath $normalizedTargetPath -PathType Container)) {
    throw ("Worktree creation failed; folder not created: {0}" -f $normalizedTargetPath)
  }

  $gitMarker = Join-Path $normalizedTargetPath ".git"
  if (-not (Test-Path -LiteralPath $gitMarker)) {
    throw ("Worktree creation failed; missing .git marker: {0}" -f $gitMarker)
  }

  [void](Invoke-External -FilePath "git" -Arguments @("-C", $normalizedTargetPath, "status", "--short") -WorkingDirectory $normalizedTargetPath)
  $insideProbe = (Invoke-External -FilePath "git" -Arguments @("-C", $normalizedTargetPath, "rev-parse", "--is-inside-work-tree") -WorkingDirectory $normalizedTargetPath).StdOut.Trim()
  if ($insideProbe.ToLowerInvariant() -ne "true") {
    throw ("Worktree verification failed; rev-parse did not confirm worktree: {0}" -f $normalizedTargetPath)
  }

  return [pscustomobject]@{
    Path         = $normalizedTargetPath
    Branch       = $branchToUse
    WasRecovered = $true
  }
}

function Ensure-WorktreeWithRetry {
  param(
    [Parameter(Mandatory)][string]$RepoRoot,
    [Parameter(Mandatory)][string]$WorktreePath,
    [Parameter(Mandatory)][string]$PreferredBranch
  )

  $maxAttempts = 3
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
      return Ensure-Worktree -RepoRoot $RepoRoot -WorktreePath $WorktreePath -PreferredBranch $PreferredBranch
    }
    catch {
      $message = $_.Exception.Message
      if ($attempt -ge $maxAttempts) {
        throw
      }

      $delayMs = $script:RetryDelaysMs[[Math]::Min($attempt - 1, $script:RetryDelaysMs.Count - 1)]
      Write-StructuredLog -Level "WARN" -Message ("Ensure-Worktree attempt {0}/{1} failed for {2}. Retrying in {3}ms. Error: {4}" -f $attempt, $maxAttempts, $WorktreePath, $delayMs, $message)
      Start-Sleep -Milliseconds $delayMs
    }
  }

  throw ("Ensure-Worktree retry loop exhausted unexpectedly for path: {0}" -f $WorktreePath)
}

function Ensure-PromptStub {
  param(
    [Parameter(Mandatory)][string]$WorktreePath,
    [Parameter(Mandatory)][string]$AgentName,
    [Parameter(Mandatory)][string]$BranchName
  )

  New-Or-Ensure-Dir -Path $WorktreePath
  if (-not (Test-Path -LiteralPath $WorktreePath -PathType Container)) {
    throw ("worktree creation failed; folder not created: {0}" -f $WorktreePath)
  }

  if (-not (Test-ValidWorktreePath -WorktreePath $WorktreePath)) {
    throw ("worktree creation failed; folder not created as valid worktree: {0}" -f $WorktreePath)
  }

  $stubPath = Join-Path $WorktreePath "CODEX_PROMPT_CURRENT.txt"
  $stub = @(
    ("Agent: {0}" -f $AgentName)
    ("Branch: {0}" -f $BranchName)
    ("Worktree: {0}" -f $WorktreePath)
    ("Generated: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
    ""
    "Replace this stub with the current Codex prompt for this lane."
  ) -join [Environment]::NewLine

  Set-Content -LiteralPath $stubPath -Value $stub -Encoding UTF8
  Write-StructuredLog -Level "INFO" -Message ("Prompt stub ensured: {0}" -f $stubPath)
}

function Open-WorktreeInVSCode {
  param([Parameter(Mandatory)][string]$WorktreePath)

  [void](Invoke-External -FilePath "code" -Arguments @("--new-window", $WorktreePath) -WorkingDirectory $WorktreePath)
  Write-StructuredLog -Level "INFO" -Message ("VS Code launch requested: {0}" -f $WorktreePath)
}

try {
  $repoRoot = (Invoke-External -FilePath "git" -Arguments @("rev-parse", "--show-toplevel")).StdOut.Trim()
  if ([string]::IsNullOrWhiteSpace($repoRoot)) {
    throw "Unable to resolve repository root from git."
  }
  $repoRoot = Normalize-PathText -PathText $repoRoot

  $repoName = Split-Path -Leaf $repoRoot
  $repoParent = Split-Path -Parent $repoRoot

  Write-StructuredLog -Level "CHECKPOINT" -Message ("Bootstrap start for repo: {0}" -f $repoRoot)
  Write-StructuredLog -Level "INFO" -Message ("Parent folder for side-by-side worktrees: {0}" -f $repoParent)

  [void](Invoke-External -FilePath "git" -Arguments @("-C", $repoRoot, "fetch", "--all", "--prune") -WorkingDirectory $repoRoot -AllowFailure)

  $lanes = @(
    [pscustomobject]@{ Agent = "CODEX A"; Branch = "codex-A-slide01-05"; Folder = ("{0}__codex-A__slide01-05" -f $repoName) },
    [pscustomobject]@{ Agent = "CODEX B"; Branch = "codex-B-slide06-10"; Folder = ("{0}__codex-B__slide06-10" -f $repoName) },
    [pscustomobject]@{ Agent = "CODEX C"; Branch = "codex-C-slide11-19"; Folder = ("{0}__codex-C__slide11-19" -f $repoName) },
    [pscustomobject]@{ Agent = "CODEX D"; Branch = "codex-D-slide00"; Folder = ("{0}__codex-D__slide00" -f $repoName) }
  )

  $laneResults = New-Object System.Collections.Generic.List[object]
  $total = $lanes.Count
  $current = 0

  foreach ($lane in $lanes) {
    $current++
    $pct = [int](($current - 1) * 100 / [Math]::Max($total, 1))
    Write-Progress -Activity "INVERSION worktree bootstrap" -Status ("Ensuring {0}" -f $lane.Agent) -CurrentOperation $lane.Branch -PercentComplete $pct

    $worktreePath = Join-Path $repoParent $lane.Folder
    Write-StructuredLog -Level "CHECKPOINT" -Message ("[{0}/{1}] {2} -> {3}" -f $current, $total, $lane.Agent, $worktreePath)

    $resolved = Ensure-WorktreeWithRetry -RepoRoot $repoRoot -WorktreePath $worktreePath -PreferredBranch $lane.Branch
    Ensure-PromptStub -WorktreePath $resolved.Path -AgentName $lane.Agent -BranchName $resolved.Branch
    Open-WorktreeInVSCode -WorktreePath $resolved.Path

    $laneResults.Add([pscustomobject]@{
      Agent    = $lane.Agent
      Branch   = $resolved.Branch
      Path     = $resolved.Path
      Recovered = $resolved.WasRecovered
    })
  }

  Write-Progress -Activity "INVERSION worktree bootstrap" -Status "Finalizing" -CurrentOperation "Self-check" -PercentComplete 98

  Write-StructuredLog -Level "CHECKPOINT" -Message "Self-check: git worktree list"
  $summary = (Invoke-External -FilePath "git" -Arguments @("-C", $repoRoot, "worktree", "list") -WorkingDirectory $repoRoot).StdOut
  foreach ($line in ($summary -split "`r?`n")) {
    if (-not [string]::IsNullOrWhiteSpace($line)) {
      Write-StructuredLog -Level "INFO" -Message $line
    }
  }

  Write-Progress -Activity "INVERSION worktree bootstrap" -Completed
  Write-StructuredLog -Level "CHECKPOINT" -Message ("Bootstrap completed. Lanes configured: {0}" -f $laneResults.Count)
  exit 0
}
catch {
  Write-Progress -Activity "INVERSION worktree bootstrap" -Completed
  Write-StructuredLog -Level "ERROR" -Message ("Bootstrap failed: {0}" -f $_.Exception.Message)
  Write-Host "Suggested recovery:" -ForegroundColor Yellow
  Write-Host ("  git -C ""{0}"" worktree prune" -f (Get-Location).Path) -ForegroundColor Yellow
  Write-Host "  Check OneDrive/indexing locks and retry." -ForegroundColor Yellow
  exit 1
}
