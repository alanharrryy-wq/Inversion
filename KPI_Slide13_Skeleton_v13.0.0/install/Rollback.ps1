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
$transcriptFile = Join-Path $logDir ("KPI_Slide13_Skeleton_ROLLBACK_v13.0.0_{0}.log" -f $stamp)

Start-Transcript -Path $transcriptFile -Force | Out-Null

try {
  Write-Head "Rollback KPI Slide 13 Skeleton v13.0.0"

  $defaultRoot = (Get-Location).Path
  $root = Read-Host "Ruta del PROYECTO (Enter = $defaultRoot)"
  if ([string]::IsNullOrWhiteSpace($root)) { $root = $defaultRoot }
  if (-not (Test-Path -LiteralPath $root)) { throw "No existe la ruta: $root" }

  $pointer = Join-Path $root "_backup_KPI_Slide13_Skeleton_POINTER.txt"
  if (-not (Test-Path -LiteralPath $pointer)) {
    throw "No encontré el pointer de backup: $pointer"
  }

  $backup = (Get-Content -LiteralPath $pointer -ErrorAction Stop | Select-Object -First 1).Trim()
  if ([string]::IsNullOrWhiteSpace($backup) -or -not (Test-Path -LiteralPath $backup)) {
    throw "Backup inválido/no existe: $backup"
  }

  $files = Get-ChildItem -LiteralPath $backup -File -Recurse
  $i = 0
  foreach ($f in $files) {
    $i++
    $rel = $f.FullName.Substring($backup.Length).TrimStart('\')
    $dst = Join-Path $root $rel
    $dstDir = Split-Path -Parent $dst
    Ensure-Dir $dstDir
    Copy-Item -LiteralPath $f.FullName -Destination $dst -Force

    $pct = [int](($i / $files.Count) * 100)
    Write-Progress -Activity "Restaurando Backup Slide 13 KPI" -Status "$pct% ($i/$($files.Count))" -PercentComplete $pct
  }

  Write-Progress -Activity "Restaurando Backup Slide 13 KPI" -Completed
  Write-Host ""
  Write-Host "✅ Rollback completado desde:" -ForegroundColor Green
  Write-Host "   $backup"
  Write-Host ""
  Write-Host "LOG:" -ForegroundColor Cyan
  Write-Host "   $transcriptFile"
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
