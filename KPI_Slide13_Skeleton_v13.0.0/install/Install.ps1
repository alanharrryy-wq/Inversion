$ErrorActionPreference='Stop'
$PSDefaultParameterValues['*:ErrorAction']='Stop'

function Write-Head($t) {
  Write-Host ""
  Write-Host ("=" * 70)
  Write-Host (" " + $t)
  Write-Host ("=" * 70)
}

function Ensure-Dir([string]$p) {
  if (-not (Test-Path -LiteralPath $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logDir = "F:\OneDrive\Descargas chido\10.Obsoleto"
Ensure-Dir $logDir
$transcriptFile = Join-Path $logDir ("KPI_Slide13_Skeleton_v13.0.0_{0}.log" -f $stamp)

Start-Transcript -Path $transcriptFile -Force | Out-Null

try {
  Write-Head "Install KPI Slide 13 Skeleton v13.0.0"

  $defaultRoot = (Get-Location).Path
  $root = Read-Host "Ruta del PROYECTO (Enter = $defaultRoot)"
  if ([string]::IsNullOrWhiteSpace($root)) { $root = $defaultRoot }
  if (-not (Test-Path -LiteralPath $root)) { throw "No existe la ruta: $root" }

  $payload = Join-Path $PSScriptRoot "..\payload"
  $payload = (Resolve-Path $payload).Path

  $backup = Join-Path $root ("_backup_KPI_Slide13_Skeleton_v13.0.0_" + $stamp)
  Ensure-Dir $backup

  # Files to copy
  $files = @(
    "src\slides\Slide13.tsx",
    "src\widgets\kpi\kpi.data.ts",
    "src\widgets\kpi\kpi.hooks.ts",
    "src\widgets\kpi\KpiScene.tsx",
    "src\widgets\kpi\KpiGrid.tsx",
    "src\widgets\kpi\KpiHud.tsx",
    "src\widgets\kpi\KpiTelemetry.tsx",
    "src\widgets\kpi\KpiDashboard.tsx"
  )

  $i = 0
  foreach ($rel in $files) {
    $i++
    $src = Join-Path $payload $rel
    $dst = Join-Path $root $rel
    $dstDir = Split-Path -Parent $dst
    Ensure-Dir $dstDir

    # Backup existing
    if (Test-Path -LiteralPath $dst) {
      $b = Join-Path $backup $rel
      Ensure-Dir (Split-Path -Parent $b)
      Copy-Item -LiteralPath $dst -Destination $b -Force
    }

    Copy-Item -LiteralPath $src -Destination $dst -Force

    $pct = [int](($i / $files.Count) * 100)
    Write-Progress -Activity "Instalando Skeleton Slide 13 KPI" -Status "$pct% ($i/$($files.Count))" -PercentComplete $pct
  }

  # Save pointer file for rollback
  $pointer = Join-Path $root "_backup_KPI_Slide13_Skeleton_POINTER.txt"
  Set-Content -LiteralPath $pointer -Value $backup -Encoding UTF8

  Write-Progress -Activity "Instalando Skeleton Slide 13 KPI" -Completed
  Write-Host ""
  Write-Host "✅ Instalado. Backup creado en:" -ForegroundColor Green
  Write-Host "   $backup"
  Write-Host ""
  Write-Host "LOG:" -ForegroundColor Cyan
  Write-Host "   $transcriptFile"
  Write-Host ""
  Write-Host "Tip: corre tu dev server y prueba Slide 13."
}
catch {
  Write-Host ""
  Write-Host "[CRASH] Algo tronó:" -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host ""
  Write-Host "LOG:" -ForegroundColor Yellow
  Write-Host $transcriptFile
}
finally {
  try { Stop-Transcript | Out-Null } catch {}
  Write-Host ""
  Read-Host "Enter para cerrar"
}
