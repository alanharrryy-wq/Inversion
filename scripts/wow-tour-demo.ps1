param(
  [int]$ProbeStartPort = 3000,
  [int]$ProbeEndPort = 3010,
  [int]$AutoExitSeconds = 0
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envFile = Join-Path $root ".env.local"
$npmCmd = "npm"
$devProcess = $null

function Write-PurpleProgress {
  param(
    [int]$Percent,
    [string]$Status,
    [string]$Current
  )

  Write-Progress -Activity "WOW Tour Demo" -Status $Status -CurrentOperation $Current -PercentComplete $Percent
}

function Test-HttpPort {
  param([int]$Port)
  try {
    $url = "http://127.0.0.1:$Port/"
    $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 1 -ErrorAction Stop
    return $response.StatusCode -ge 200
  }
  catch {
    return $false
  }
}

function Stop-Dev {
  if ($null -ne $devProcess -and -not $devProcess.HasExited) {
    try {
      & taskkill /PID $devProcess.Id /T /F | Out-Null
    } catch {
      try { Stop-Process -Id $devProcess.Id -Force -ErrorAction SilentlyContinue } catch {}
    }
  }
}

try {
  Write-PurpleProgress -Percent 5 -Status "Preparing environment" -Current "Writing .env.local"

  $envContent = @(
    "VITE_WOW_DEMO=1",
    "VITE_WOW_TOUR=1",
    "VITE_WOW_TOUR_SCRIPT=enterprise",
    "VITE_WOW_TOUR_AUTOSTART=1",
    "VITE_WOW_DIAGNOSTICS=1",
    "VITE_WOW_SPOTLIGHT_V2=1",
    "VITE_WOW_TOUR_CHOREO=1",
    "VITE_WOW_TARGET_MAGNET=1",
    "VITE_WOW_DIRECTOR_MODE=1",
    "VITE_WOW_DEMO_SCRIPT=1",
    "VITE_WOW_OPENING_IMPACT=1",
    "VITE_WOW_EVIDENCE_IMPACT=1",
    "VITE_WOW_MODEL_IMPACT=1",
    "VITE_WOW_OPENING_CINEMA=1",
    "VITE_WOW_PROOF_LOCK=1",
    "VITE_WOW_CORE_MODULES=1",
    "VITE_WOW_AI_MOMENT=1",
    "VITE_WOW_CASE_REVEAL=1",
    "VITE_WOW_MIRROR=1",
    "VITE_WOW_REVEAL=1",
    "VITE_WOW_XRAY=1",
    "VITE_WOW_OVERLAY=1"
  ) -join "`r`n"

  Set-Content -Path $envFile -Value $envContent -NoNewline

  Write-PurpleProgress -Percent 20 -Status "Starting dev server" -Current "npm run dev"
  $devProcess = Start-Process -FilePath $npmCmd -ArgumentList "run", "dev" -WorkingDirectory $root -PassThru

  $detectedPort = $null
  $attempts = 0
  $maxAttempts = 40

  while ($attempts -lt $maxAttempts -and -not $detectedPort) {
    $attempts++
    $pct = [Math]::Min(90, 20 + [int](($attempts / $maxAttempts) * 65))
    Write-PurpleProgress -Percent $pct -Status "Waiting for Vite" -Current "Probe ports $ProbeStartPort-$ProbeEndPort"

    for ($port = $ProbeStartPort; $port -le $ProbeEndPort; $port++) {
      if (Test-HttpPort -Port $port) {
        $detectedPort = $port
        break
      }
    }

    if (-not $detectedPort) {
      Start-Sleep -Milliseconds 700
      if ($devProcess.HasExited) {
        throw "Dev process exited early with code $($devProcess.ExitCode)."
      }
    }
  }

  if (-not $detectedPort -and (Test-HttpPort -Port 5173)) {
    $detectedPort = 5173
  }

  if (-not $detectedPort) {
    throw "Unable to detect Vite on ports $ProbeStartPort-$ProbeEndPort."
  }

  $url = "http://127.0.0.1:$detectedPort"
  Write-PurpleProgress -Percent 95 -Status "Opening browser" -Current $url
  Start-Process $url | Out-Null

  Write-PurpleProgress -Percent 100 -Status "Demo ready" -Current "WOW Tour should autostart"
  Write-Host "WOW tour demo running at $url"
  Write-Host "If you don't see overlay: toggle diagnostics flag (VITE_WOW_DIAGNOSTICS=1)."
  Write-Host "Director mode is available via on-screen toggle."
  Write-Host "Press Ctrl+C to stop and cleanup this session."

  $elapsed = 0
  while (-not $devProcess.HasExited) {
    Start-Sleep -Seconds 1
    if ($AutoExitSeconds -gt 0) {
      $elapsed++
      if ($elapsed -ge $AutoExitSeconds) {
        break
      }
    }
  }
}
finally {
  Stop-Dev
  Write-PurpleProgress -Percent 100 -Status "Cleanup complete" -Current "Stopped dev process"
}
