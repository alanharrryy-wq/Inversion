param()

$ErrorActionPreference = 'Stop'
$start = Get-Date

$npmCmd = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
if (-not $npmCmd) {
  throw 'npm.cmd could not be resolved from PATH.'
}

$tasks = @(
  @{ Name = 'Typecheck'; Args = @('/c', "`"$npmCmd`" run typecheck") },
  @{ Name = 'Build'; Args = @('/c', "`"$npmCmd`" run build") }
)

$results = @()
for ($i = 0; $i -lt $tasks.Count; $i++) {
  $task = $tasks[$i]
  $pct = [int](($i / $tasks.Count) * 100)
  Write-Progress -Activity 'WOW validation' -Status $task.Name -PercentComplete $pct

  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  $ok = $true
  try {
    & cmd.exe @($task.Args)
    if ($LASTEXITCODE -ne 0) {
      throw "Command exited with code $LASTEXITCODE"
    }
  }
  catch {
    $ok = $false
    Write-Host "[FAIL] $($task.Name): $($_.Exception.Message)" -ForegroundColor Red
  }
  finally {
    $sw.Stop()
  }

  $results += [PSCustomObject]@{
    Task = $task.Name
    Success = $ok
    Seconds = [math]::Round($sw.Elapsed.TotalSeconds, 2)
  }

  if (-not $ok) {
    break
  }
}

Write-Progress -Activity 'WOW validation' -Completed

$totalSec = [math]::Round(((Get-Date) - $start).TotalSeconds, 2)
$okCount = ($results | Where-Object { $_.Success }).Count
$allOk = $okCount -eq $tasks.Count

Write-Host ''
Write-Host 'WOW validation summary' -ForegroundColor Cyan
$results | ForEach-Object {
  $tag = if ($_.Success) { 'OK' } else { 'FAIL' }
  Write-Host (" - {0}: {1} ({2}s)" -f $_.Task, $tag, $_.Seconds)
}
Write-Host ("Total: {0}s" -f $totalSec)

if (-not $allOk) {
  exit 1
}
