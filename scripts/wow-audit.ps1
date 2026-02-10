param()

$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$forbidden = @(
  'components/slides/Slide09.tsx',
  'components/slides/Slide16.tsx'
)

$status = git status --porcelain
$failed = $false

Write-Progress -Activity 'WOW audit' -Status 'Checking forbidden files' -PercentComplete 30
foreach ($path in $forbidden) {
  if ($status -match [regex]::Escape($path)) {
    Write-Host "[FAIL] Forbidden file changed: $path" -ForegroundColor Red
    $failed = $true
  } else {
    Write-Host "[OK] Forbidden file untouched: $path"
  }
}

Write-Progress -Activity 'WOW audit' -Status 'Checking required flags' -PercentComplete 70
$wow = Get-Content config\wow.ts -Raw
$required = @('WOW_GUIDE_ENGINE','WOW_TOUR_POLISH','WOW_DIRECTOR_OVERLAY','WOW_SLIDE05_INTERACTIVE')
foreach ($flag in $required) {
  if ($wow -match $flag) {
    Write-Host "[OK] Flag found: $flag"
  } else {
    Write-Host "[FAIL] Missing flag: $flag" -ForegroundColor Red
    $failed = $true
  }
}

Write-Progress -Activity 'WOW audit' -Completed
if ($failed) { exit 1 }
