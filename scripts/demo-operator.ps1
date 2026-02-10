param(
  [ValidateSet('stub','real','both')]
  [string]$Mode = 'stub',
  [int]$FrontendPort = 0,
  [switch]$Start,
  [switch]$KeepAlive,
  [switch]$KillPorts
)

$ErrorActionPreference = 'Stop'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..')
$RunDir = Join-Path $Root '.run'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$LogPath = Join-Path $RunDir ("demo-operator-$Timestamp.log")
$PidPath = Join-Path $RunDir 'demo-operator.pids.json'
$script:Started = [ordered]@{
  backend = $null
  frontend = $null
  all = New-Object System.Collections.Generic.List[int]
}
$script:VitePort = 0
$script:Pass = $true

function Ensure-RunDir {
  if (-not (Test-Path $RunDir)) {
    New-Item -ItemType Directory -Path $RunDir | Out-Null
  }
}

function Write-Log {
  param([string]$Message)
  $line = "$(Get-Date -Format 's') $Message"
  Write-Host $line
  Add-Content -Path $LogPath -Value $line
}

function Register-Failure {
  param([string]$Message)
  $script:Pass = $false
  Write-Log "FAIL $Message"
}

function Register-Pass {
  param([string]$Message)
  Write-Log "PASS $Message"
}

function Is-Running {
  param([int]$ProcessId)
  if ($ProcessId -le 0) { return $false }
  try {
    $null = Get-Process -Id $ProcessId -ErrorAction Stop
    return $true
  } catch {
    return $false
  }
}

function Stop-TrackedPid {
  param([int]$ProcessId,[string]$Reason)
  if ($ProcessId -le 0) { return }
  if (-not (Is-Running -ProcessId $ProcessId)) { return }
  Write-Log "cleanup stopping PID=$ProcessId reason=$Reason"
  try { Stop-Process -Id $ProcessId -Force -ErrorAction Stop } catch { Write-Log "cleanup warning stop failed PID=$ProcessId error=$($_.Exception.Message)" }
}

function Cleanup-Tracked {
  param([string]$Reason)
  if ($KeepAlive) {
    Write-Log "cleanup skipped (KeepAlive) reason=$Reason"
    return
  }

  Write-Log "cleanup phase begin reason=$Reason"
  $seen = @{}
  foreach ($procId in $script:Started.all) {
    if ($procId -gt 0 -and -not $seen.ContainsKey($procId)) {
      $seen[$procId] = $true
      Stop-TrackedPid -ProcessId $procId -Reason $Reason
    }
  }
  Write-Log "cleanup phase done"
}

function Save-PidFile {
  param([string]$RunMode,[string]$BackendCmd,[string]$FrontendCmd)
  $payload = [ordered]@{
    startedAt = (Get-Date).ToString('o')
    mode = $RunMode
    backendPid = $script:Started.backend
    frontendPid = $script:Started.frontend
    ports = [ordered]@{
      backend = 8787
      frontend = $script:VitePort
    }
    commands = [ordered]@{
      backend = $BackendCmd
      frontend = $FrontendCmd
    }
  }
  $json = $payload | ConvertTo-Json -Depth 6
  Set-Content -Path $PidPath -Value $json -Encoding UTF8
  Write-Log "pid file updated path=$PidPath"
}

function Remove-PidFile {
  if ($KeepAlive) { return }
  if (Test-Path $PidPath) {
    Remove-Item -Path $PidPath -Force -ErrorAction SilentlyContinue
    Write-Log "pid file removed path=$PidPath"
  }
}

function Cleanup-StaleFromPidFile {
  if (-not (Test-Path $PidPath)) { return }

  Write-Log "stale cleanup phase begin"
  try {
    $stale = Get-Content -Raw $PidPath | ConvertFrom-Json
    if ($null -ne $stale.backendPid) { Stop-TrackedPid -ProcessId ([int]$stale.backendPid) -Reason 'stale_pid_file' }
    if ($null -ne $stale.frontendPid) { Stop-TrackedPid -ProcessId ([int]$stale.frontendPid) -Reason 'stale_pid_file' }
  } catch {
    Write-Log "stale cleanup warning parse failed error=$($_.Exception.Message)"
  }
  Write-Log "stale cleanup phase done"
}

function Test-PortListening {
  param([int]$Port)
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  return $null -ne $conn
}

function Find-VitePort {
  param([int]$ForcedPort)
  if ($ForcedPort -gt 0) { return $ForcedPort }
  $ports = (3000..3010) + (5173..5180)
  foreach ($p in $ports) {
    try {
      $health = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:$p/api/health" -TimeoutSec 2
      if ($null -ne $health -and $health.PSObject.Properties.Name -contains 'ok') {
        return [int]$p
      }
    } catch {}
  }
  return 0
}

function Start-TrackedProcess {
  param([string]$FilePath,[string[]]$ProcessArgs,[string]$DisplayCommand,[string]$Name)

  $out = Join-Path $RunDir ("$Name-$Timestamp.out.log")
  $err = Join-Path $RunDir ("$Name-$Timestamp.err.log")
  $proc = Start-Process -FilePath $FilePath -ArgumentList $ProcessArgs -WorkingDirectory $Root -PassThru -RedirectStandardOutput $out -RedirectStandardError $err
  $script:Started.all.Add($proc.Id)
  Write-Log "start phase $Name pid=$($proc.Id) command=$DisplayCommand"
  return $proc.Id
}

function Wait-ForCondition {
  param([scriptblock]$Condition,[int]$TimeoutSec,[string]$Name)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (& $Condition) { return $true }
    Start-Sleep -Milliseconds 500
  }
  Write-Log "wait timeout name=$Name timeoutSec=$TimeoutSec"
  return $false
}

function Kill-ListenProcessByPort {
  param([int]$Port)
  $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  if (-not $conns) {
    Write-Log "KillPorts: no LISTEN process on port=$Port"
    return
  }

  $ids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $ids) {
    Write-Log "KillPorts: terminating pid=$procId port=$Port"
    try { Stop-Process -Id $procId -Force -ErrorAction Stop } catch { Write-Log "KillPorts warning pid=$procId error=$($_.Exception.Message)" }
  }
}

function Run-Verify {
  param([string]$Target)
  $scriptPath = if ($Target -eq 'real') { 'scripts/verify-ai.mjs' } else { 'scripts/verify-demo.mjs' }
  Write-Log "verify phase running target=$Target script=$scriptPath"
  & node $scriptPath
  if ($LASTEXITCODE -ne 0) {
    Register-Failure "verify script failed target=$Target"
  } else {
    Register-Pass "verify script passed target=$Target"
  }
}

Ensure-RunDir
Set-Content -Path $LogPath -Value "" -Encoding UTF8

try {
  Write-Log "start phase begin mode=$Mode start=$($Start.IsPresent) keepAlive=$($KeepAlive.IsPresent) killPorts=$($KillPorts.IsPresent)"
  Cleanup-StaleFromPidFile

  $backendCmd = 'node .\node_modules\tsx\dist\cli.mjs watch server/index.ts'
  $frontendCmd = 'node .\node_modules\vite\bin\vite.js --host 127.0.0.1'

  if ($Start) {
    $script:Started.backend = Start-TrackedProcess -FilePath 'node.exe' -ProcessArgs @('.\node_modules\tsx\dist\cli.mjs','watch','server/index.ts') -DisplayCommand $backendCmd -Name 'backend'
    $script:Started.frontend = Start-TrackedProcess -FilePath 'node.exe' -ProcessArgs @('.\node_modules\vite\bin\vite.js','--host','127.0.0.1') -DisplayCommand $frontendCmd -Name 'frontend'

    Save-PidFile -RunMode $Mode -BackendCmd $backendCmd -FrontendCmd $frontendCmd

    $backendReady = Wait-ForCondition -Condition { Test-PortListening -Port 8787 } -TimeoutSec 60 -Name 'backend_8787'
    if (-not $backendReady) { Register-Failure 'backend did not start on port 8787' }

    $script:VitePort = 0
    $frontendReady = Wait-ForCondition -Condition { $script:VitePort = Find-VitePort -ForcedPort $FrontendPort; $script:VitePort -gt 0 } -TimeoutSec 60 -Name 'vite_port'
    if (-not $frontendReady) { Register-Failure 'frontend Vite port not detected' }
    if ($frontendReady) { Register-Pass "frontend detected port=$script:VitePort" }

    Save-PidFile -RunMode $Mode -BackendCmd $backendCmd -FrontendCmd $frontendCmd
  } else {
    $backendUp = Test-PortListening -Port 8787
    $script:VitePort = Find-VitePort -ForcedPort $FrontendPort
    if (-not $backendUp -or $script:VitePort -eq 0) {
      $msg = 'Servers not running. Run npm run dev or rerun operator with -Start.'
      Register-Failure $msg
      Write-Host $msg
      exit 1
    }
    Register-Pass 'verify-only mode found running servers'
  }

  Write-Log 'verify phase begin'
  switch ($Mode) {
    'stub' { Run-Verify -Target 'stub' }
    'real' { Run-Verify -Target 'real' }
    'both' {
      Run-Verify -Target 'stub'
      Run-Verify -Target 'real'
    }
  }

  if ($KillPorts) {
    Write-Log 'cleanup phase KillPorts begin'
    Kill-ListenProcessByPort -Port 8787
    $killVitePort = if ($script:VitePort -gt 0) { $script:VitePort } else { Find-VitePort -ForcedPort $FrontendPort }
    if ($killVitePort -gt 0) {
      Kill-ListenProcessByPort -Port $killVitePort
    } else {
      Write-Log 'KillPorts: no Vite port detected'
    }
    Write-Log 'cleanup phase KillPorts done'
  }

  if ($script:Pass) {
    Write-Log 'PASS operator completed'
    exit 0
  }

  Write-Log 'FAIL operator completed with errors'
  exit 1
}
finally {
  Cleanup-Tracked -Reason 'operator_finally'
  Remove-PidFile
}
