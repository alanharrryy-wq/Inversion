param()

$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
Push-Location $root

try {
  $checks = @(
    'Flag defaults are explicit in config/wow.ts',
    'Forbidden files are untouched in current diff',
    'No global keybind additions in guide modules',
    'Guide modules contain no network/random calls'
  )

  $failures = New-Object System.Collections.Generic.List[string]
  $warnings = New-Object System.Collections.Generic.List[string]
  $details = New-Object System.Collections.Generic.List[string]

  for ($i = 0; $i -lt $checks.Count; $i++) {
    $name = $checks[$i]
    $pct = [int](($i / $checks.Count) * 100)
    Write-Progress -Activity 'WOW guide smoke' -Status $name -PercentComplete $pct

    switch ($i) {
      0 {
        $config = Get-Content 'config/wow.ts' -Raw
        $required = @(
          'VITE_WOW_GUIDE_ENGINE',
          'VITE_WOW_GUIDE_UI',
          'VITE_WOW_OPERATOR_PANEL',
          'VITE_WOW_SLIDE05_EXTRAHEIGHT'
        )

        foreach ($flag in $required) {
          if ($config -notmatch [Regex]::Escape($flag)) {
            $failures.Add("Missing flag: $flag")
          }
        }

        if ($config -notmatch 'WOW_GUIDE_ENGINE\s*=\s*WOW_DEMO\s*&&\s*envFlag\(env\?\.VITE_WOW_GUIDE_ENGINE\)') {
          $failures.Add('WOW_GUIDE_ENGINE is not explicitly gated by WOW_DEMO and envFlag.')
        }

        if ($config -notmatch 'WOW_GUIDE_UI\s*=\s*WOW_DEMO\s*&&\s*envFlag\(env\?\.VITE_WOW_GUIDE_UI\)') {
          $failures.Add('WOW_GUIDE_UI is not explicitly gated by WOW_DEMO and envFlag.')
        }

        if ($config -notmatch 'WOW_OPERATOR_PANEL\s*=\s*WOW_DEMO\s*&&\s*envFlag\(env\?\.VITE_WOW_OPERATOR_PANEL\)') {
          $failures.Add('WOW_OPERATOR_PANEL is not explicitly gated by WOW_DEMO and envFlag.')
        }

        if ($config -notmatch 'WOW_SLIDE05_EXTRAHEIGHT\s*=\s*WOW_DEMO\s*&&\s*envFlag\(env\?\.VITE_WOW_SLIDE05_EXTRAHEIGHT\)') {
          $failures.Add('WOW_SLIDE05_EXTRAHEIGHT is not explicitly gated by WOW_DEMO and envFlag.')
        }

        $details.Add('Flag checks completed.')
      }
      1 {
        $forbidden = @('components/slides/Slide09.tsx', 'components/slides/Slide16.tsx')
        foreach ($file in $forbidden) {
          $diff = git diff --name-only -- $file
          if ($LASTEXITCODE -ne 0) {
            $failures.Add("git diff failed while checking $file")
            continue
          }
          if ($diff) {
            $warnings.Add("Forbidden file has pending diff: $file")
          }
        }
        $details.Add('Forbidden file check completed.')
      }
      2 {
        $patterns = @(
          'window.addEventListener("keydown"',
          "window.addEventListener('keydown'",
          'document.addEventListener("keydown"',
          "document.addEventListener('keydown'"
        )

        $matches = Get-ChildItem -Recurse -File wow/tour/guide | Select-String -Pattern $patterns -SimpleMatch
        if ($matches) {
          $render = ($matches | ForEach-Object { "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }) -join "`n"
          $failures.Add("Global key listener found in guide modules:`n$render")
        }

        $details.Add('Global keybind scan completed.')
      }
      3 {
        $networkMatches = rg -n --glob '*.ts' --glob '*.tsx' --glob '*.css' 'fetch\(|XMLHttpRequest|axios|navigator\.sendBeacon|http://|https://|Math\.random|crypto\.randomUUID' wow/tour/guide 2>$null
        if ($LASTEXITCODE -gt 1) {
          $failures.Add('Failed to scan guide modules for network/random usage.')
        } elseif ($networkMatches) {
          $failures.Add("Network/random usage found in guide modules:`n$networkMatches")
        }

        $details.Add('Determinism scan completed.')
      }
    }
  }

  Write-Progress -Activity 'WOW guide smoke' -Completed

  Write-Host ''
  Write-Host 'WOW guide smoke summary' -ForegroundColor Cyan
  foreach ($line in $details) {
    Write-Host " - $line"
  }

  if ($warnings.Count -gt 0) {
    Write-Host ''
    Write-Host 'Warnings' -ForegroundColor Yellow
    foreach ($warn in $warnings) {
      Write-Host " - $warn"
    }
  }

  if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host 'Failures' -ForegroundColor Red
    foreach ($item in $failures) {
      Write-Host " - $item"
    }
    exit 1
  }

  Write-Host ''
  Write-Host 'Result: PASS' -ForegroundColor Green
}
finally {
  Pop-Location
}
