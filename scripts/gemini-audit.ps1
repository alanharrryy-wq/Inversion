[CmdletBinding()]
param(
  [Parameter(Mandatory = $false)]
  [string] $RepoRoot = (Get-Location).Path,

  [Parameter(Mandatory = $false)]
  [string] $OutFile = "GEMINI_EXPOSURE_AUDIT.md",

  [Parameter(Mandatory = $false)]
  [switch] $Strict,

  [Parameter(Mandatory = $false)]
  [switch] $IncludeNodeModules
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-FullPath([string]$PathValue) {
  try {
    return (Resolve-Path -LiteralPath $PathValue).Path
  }
  catch {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
}

function To-RelPath([string]$BasePath, [string]$FullPath) {
  $baseUri = [Uri]((Resolve-FullPath $BasePath).TrimEnd('\') + '\')
  $fullUri = [Uri](Resolve-FullPath $FullPath)
  $rel = $baseUri.MakeRelativeUri($fullUri).ToString()
  return [Uri]::UnescapeDataString($rel).Replace('/', '\')
}

function Normalize-RelPath([string]$PathValue) {
  return $PathValue.Replace('/', '\').TrimStart('.\')
}

function Escape-Markdown([string]$Value) {
  if ($null -eq $Value) { return "" }
  return $Value.Replace("|", "\|")
}

function Clip-Text([string]$Value, [int]$MaxLength = 220) {
  if ($null -eq $Value) { return "" }
  $trimmed = $Value.Trim()
  if ($trimmed.Length -le $MaxLength) { return $trimmed }
  return $trimmed.Substring(0, $MaxLength) + "..."
}

function Is-CommentOnly([string]$LineText) {
  $line = $LineText.TrimStart()
  return $line.StartsWith("//") -or
    $line.StartsWith("/*") -or
    $line.StartsWith("*") -or
    $line.StartsWith("#")
}

function Get-Scope([string]$RelPathRaw) {
  $relPath = Normalize-RelPath $RelPathRaw
  $lower = $relPath.ToLowerInvariant()
  $fileName = [System.IO.Path]::GetFileName($lower)

  if (
    $lower.StartsWith("components\") -or
    $lower.StartsWith("src\") -or
    $lower.StartsWith("public\") -or
    $lower -eq "index.html" -or
    $fileName -match '^vite\.config\.(ts|js|mjs|cjs|mts|cts)$'
  ) {
    return "CLIENT"
  }

  if ($lower.StartsWith("server\")) { return "SERVER" }
  if ($lower.StartsWith("scripts\") -or $lower.EndsWith(".mjs")) { return "TOOLING" }
  if ($lower -eq "readme.md" -or $lower.EndsWith(".md")) { return "DOCS" }
  return "OTHER"
}

function New-Finding(
  [string]$Severity,
  [string]$Scope,
  [string]$RuleId,
  [string]$RuleText,
  [string]$FileRel,
  [int]$LineNumber,
  [string]$MatchText,
  [string]$Snippet
) {
  return [PSCustomObject]@{
    Severity = $Severity
    Scope = $Scope
    RuleId = $RuleId
    Rule = $RuleText
    File = $FileRel
    Line = $LineNumber
    Match = $MatchText
    Snippet = $Snippet
  }
}

function Get-ScanFiles(
  [string]$RootPath,
  [bool]$ScanNodeModules
) {
  $includeExtensions = @(
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".mts", ".cts",
    ".json", ".md", ".txt", ".yml", ".yaml", ".toml", ".ini",
    ".html", ".css", ".scss", ".sass", ".less"
  )

  $excludedDirectories = @(
    ".git", "dist", "build", ".next", ".cache", ".turbo", ".vite", "coverage",
    "tmp", "temp", ".run", ".history"
  )
  if (-not $ScanNodeModules) {
    $excludedDirectories += "node_modules"
  }

  $stack = New-Object System.Collections.Generic.Stack[string]
  $stack.Push((Resolve-FullPath $RootPath))

  $outFiles = New-Object System.Collections.Generic.List[string]

  while ($stack.Count -gt 0) {
    $current = $stack.Pop()
    $entries = Get-ChildItem -LiteralPath $current -Force -ErrorAction SilentlyContinue

    foreach ($entry in $entries) {
      if ($entry.PSIsContainer) {
        if ($excludedDirectories -contains $entry.Name) { continue }
        $stack.Push($entry.FullName)
        continue
      }

      $ext = [System.IO.Path]::GetExtension($entry.Name)
      $isEnvLike = $entry.Name -like ".env*"
      $include = $isEnvLike -or ($includeExtensions -contains $ext)
      if (-not $include) { continue }
      $outFiles.Add($entry.FullName)
    }
  }

  return $outFiles.ToArray() | Sort-Object
}

function Get-LineFromIndex([string]$Text, [int]$CharIndex) {
  if ($CharIndex -lt 0) { return 1 }
  $prefix = $Text.Substring(0, [Math]::Min($CharIndex, $Text.Length))
  return (($prefix -split "`n").Length)
}

$lineRules = @(
  @{
    Id = "CLIENT_IMPORT_GOOGLE_GENAI"
    Regex = "@google\/genai"
    Description = "Client references @google/genai (import, require, or importmap)."
    Scopes = @("CLIENT")
    ClientP0 = $true
    SkipCommentOnly = $true
  },
  @{
    Id = "CLIENT_LEGACY_ROUTE"
    Regex = "\/api\/gemini\b"
    Description = "Legacy /api/gemini route in client scope."
    Scopes = @("CLIENT")
    ClientP0 = $true
    SkipCommentOnly = $true
  },
  @{
    Id = "CLIENT_VITE_SECRET_NAME"
    Regex = "\bVITE_(?:GEMINI|GENAI|GOOGLE(?:_AI)?)(?:_[A-Z0-9_]+)?\b"
    Description = "Gemini/GenAI/Google VITE env variable in client scope."
    Scopes = @("CLIENT")
    ClientP0 = $true
    SkipCommentOnly = $true
  },
  @{
    Id = "CLIENT_IMPORT_META_ENV"
    Regex = "import\.meta\.env\.[A-Za-z0-9_]*(?:GEMINI|GENAI|GOOGLE)"
    Description = "Gemini/GenAI/Google env read via import.meta.env in client scope."
    Scopes = @("CLIENT")
    ClientP0 = $true
    SkipCommentOnly = $true
  },
  @{
    Id = "CLIENT_BRANDING_LITERAL"
    Regex = "['""][^'""]*gemini[^'""]*['""]"
    Description = "Gemini branding appears in client string literal."
    Scopes = @("CLIENT")
    ClientP0 = $true
    SkipCommentOnly = $true
  },
  @{
    Id = "SERVER_PROVIDER_IMPORT"
    Regex = "@google\/genai|GoogleGenAI"
    Description = "Server import/reference to provider SDK."
    Scopes = @("SERVER")
    ClientP0 = $false
    SkipCommentOnly = $true
  },
  @{
    Id = "SERVER_PROVIDER_KEY_NAME"
    Regex = "AI_BACKEND_API_KEY|GEMINI_API_KEY|GOOGLE(?:_AI)?_API_KEY"
    Description = "Server-side provider key variable usage."
    Scopes = @("SERVER")
    ClientP0 = $false
    SkipCommentOnly = $false
  },
  @{
    Id = "DOC_OR_TOOLING_MENTION"
    Regex = "\bgemini\b|@google\/genai|\/api\/gemini"
    Description = "Docs/tooling mention for migration traceability."
    Scopes = @("DOCS", "TOOLING")
    ClientP0 = $false
    SkipCommentOnly = $false
  }
)

$fileRules = @(
  @{
    Id = "CLIENT_VITE_DEFINE_INJECTION"
    Regex = "define\s*:\s*\{[\s\S]*?(?:gemini|genai|google)[\s\S]*?\}"
    Description = "Vite define block references Gemini/GenAI/Google (client-bundle injection risk)."
    Scopes = @("CLIENT")
    FileNameRegex = '^vite\.config\.(ts|js|mjs|cjs|mts|cts)$'
    ClientP0 = $true
  }
)

$RepoRoot = Resolve-FullPath $RepoRoot
if (-not (Test-Path -LiteralPath $RepoRoot)) {
  throw "RepoRoot not found: $RepoRoot"
}

$OutPath = Join-Path $RepoRoot $OutFile
$OutPathResolved = [System.IO.Path]::GetFullPath($OutPath)

$files = Get-ScanFiles -RootPath $RepoRoot -ScanNodeModules:$IncludeNodeModules.IsPresent
$total = [Math]::Max($files.Count, 1)

$findings = New-Object System.Collections.Generic.List[object]

Write-Progress -Activity "Gemini Exposure Audit" -Status "Preparing scan..." -PercentComplete 0

for ($index = 0; $index -lt $files.Count; $index++) {
  $file = $files[$index]
  $resolved = Resolve-FullPath $file
  if ($resolved -eq $OutPathResolved) { continue }

  $rel = To-RelPath -BasePath $RepoRoot -FullPath $file
  $scope = Get-Scope $rel
  $pct = [Math]::Min(98, [int](($index + 1) * 100 / $total))
  Write-Progress -Activity "Gemini Exposure Audit" -Status ("Scanning [{0}] {1}" -f $scope, $rel) -PercentComplete $pct

  $content = ""
  try {
    $content = [System.IO.File]::ReadAllText($file)
  }
  catch {
    continue
  }

  if ([string]::IsNullOrWhiteSpace($content)) { continue }

  $lines = $content -split "`r?`n"
  for ($lineIndex = 0; $lineIndex -lt $lines.Count; $lineIndex++) {
    $line = [string]$lines[$lineIndex]
    $lineNumber = $lineIndex + 1

    foreach ($rule in $lineRules) {
      if ($rule.Scopes -notcontains $scope) { continue }

      $regex = [regex]::new([string]$rule.Regex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
      $matches = $regex.Matches($line)
      if ($matches.Count -eq 0) { continue }
      if ($rule.SkipCommentOnly -and (Is-CommentOnly $line)) { continue }

      foreach ($match in $matches) {
        $severity = if ($scope -eq "CLIENT" -and $rule.ClientP0) { "CLIENT_P0" } else { "INFO" }
        $findings.Add(
          (New-Finding `
            -Severity $severity `
            -Scope $scope `
            -RuleId ([string]$rule.Id) `
            -RuleText ([string]$rule.Description) `
            -FileRel (Normalize-RelPath $rel) `
            -LineNumber $lineNumber `
            -MatchText (Clip-Text $match.Value 120) `
            -Snippet (Clip-Text $line 220))
        )
      }
    }
  }

  foreach ($rule in $fileRules) {
    if ($rule.Scopes -notcontains $scope) { continue }

    $fileName = [System.IO.Path]::GetFileName((Normalize-RelPath $rel)).ToLowerInvariant()
    if (-not ($fileName -match [string]$rule.FileNameRegex)) { continue }

    $regex = [regex]::new([string]$rule.Regex, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    $match = $regex.Match($content)
    if (-not $match.Success) { continue }

    $lineNumber = Get-LineFromIndex -Text $content -CharIndex $match.Index
    $lineText = if ($lineNumber -ge 1 -and $lineNumber -le $lines.Count) { [string]$lines[$lineNumber - 1] } else { "" }
    $severity = if ($scope -eq "CLIENT" -and $rule.ClientP0) { "CLIENT_P0" } else { "INFO" }
    $findings.Add(
      (New-Finding `
        -Severity $severity `
        -Scope $scope `
        -RuleId ([string]$rule.Id) `
        -RuleText ([string]$rule.Description) `
        -FileRel (Normalize-RelPath $rel) `
        -LineNumber $lineNumber `
        -MatchText (Clip-Text $match.Value 120) `
        -Snippet (Clip-Text $lineText 220))
    )
  }
}

Write-Progress -Activity "Gemini Exposure Audit" -Status "Building report..." -PercentComplete 99

$orderedFindings = @($findings | Sort-Object Severity, Scope, File, Line, RuleId)
$clientP0Findings = @($orderedFindings | Where-Object { $_.Severity -eq "CLIENT_P0" })
$infoFindings = @($orderedFindings | Where-Object { $_.Severity -eq "INFO" })

$scopeSummary = @($orderedFindings | Group-Object Scope | Sort-Object Name | ForEach-Object {
  [PSCustomObject]@{
    Scope = $_.Name
    Count = $_.Count
  }
})

$ruleSummary = @($orderedFindings | Group-Object RuleId | Sort-Object Name | ForEach-Object {
  [PSCustomObject]@{
    RuleId = $_.Name
    Count = $_.Count
  }
})

$ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
$strictText = if ($Strict) { "ON" } else { "OFF" }
$includeNodeModulesText = if ($IncludeNodeModules) { "ON" } else { "OFF" }

$builder = New-Object System.Text.StringBuilder
[void]$builder.AppendLine("# Gemini Exposure Audit")
[void]$builder.AppendLine("")
[void]$builder.AppendLine("- Timestamp: $ts")
[void]$builder.AppendLine(('- RepoRoot: `{0}`' -f $RepoRoot))
[void]$builder.AppendLine("- Strict: **$strictText**")
[void]$builder.AppendLine("- IncludeNodeModules: **$includeNodeModulesText**")
[void]$builder.AppendLine("")
[void]$builder.AppendLine("## Scope Classification")
[void]$builder.AppendLine("")
[void]$builder.AppendLine('- CLIENT: `components/**`, `src/**`, `index.html`, `vite.config.*`, `public/**`')
[void]$builder.AppendLine('- SERVER: `server/**`')
[void]$builder.AppendLine('- DOCS: `*.md`, `README`')
[void]$builder.AppendLine('- TOOLING: `scripts/**`, `*.mjs`')
[void]$builder.AppendLine("- OTHER: all remaining scanned files")
[void]$builder.AppendLine("")
[void]$builder.AppendLine("## Executive Summary")
[void]$builder.AppendLine("")
[void]$builder.AppendLine("| Metric | Count |")
[void]$builder.AppendLine("|---|---:|")
[void]$builder.AppendLine("| CLIENT_P0 (strict gate) | $($clientP0Findings.Count) |")
[void]$builder.AppendLine("| INFO (server/docs/tooling/context) | $($infoFindings.Count) |")
[void]$builder.AppendLine("| Total findings | $($orderedFindings.Count) |")
[void]$builder.AppendLine("")

if ($scopeSummary.Count -gt 0) {
  [void]$builder.AppendLine("### Findings by Scope")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("| Scope | Count |")
  [void]$builder.AppendLine("|---|---:|")
  foreach ($row in $scopeSummary) {
    [void]$builder.AppendLine("| $($row.Scope) | $($row.Count) |")
  }
  [void]$builder.AppendLine("")
}

if ($ruleSummary.Count -gt 0) {
  [void]$builder.AppendLine("### Findings by Rule")
  [void]$builder.AppendLine("")
  [void]$builder.AppendLine("| RuleId | Count |")
  [void]$builder.AppendLine("|---|---:|")
  foreach ($row in $ruleSummary) {
    [void]$builder.AppendLine("| $($row.RuleId) | $($row.Count) |")
  }
  [void]$builder.AppendLine("")
}

[void]$builder.AppendLine("## Rules")
[void]$builder.AppendLine("")
[void]$builder.AppendLine("| RuleId | Applies To | CLIENT_P0 Eligible | Meaning |")
[void]$builder.AppendLine("|---|---|---|---|")
foreach ($rule in ($lineRules + $fileRules | Sort-Object Id)) {
  $applies = [string]::Join(", ", $rule.Scopes)
  $eligible = if ($rule.ClientP0) { "Yes" } else { "No" }
  [void]$builder.AppendLine("| $($rule.Id) | $applies | $eligible | $($rule.Description) |")
}
[void]$builder.AppendLine("")

[void]$builder.AppendLine("## Findings")
[void]$builder.AppendLine("")

if ($orderedFindings.Count -eq 0) {
  [void]$builder.AppendLine("_No findings._")
  [void]$builder.AppendLine("")
}
else {
  [void]$builder.AppendLine("| Severity | RuleId | Scope | File:Line | Match | Snippet |")
  [void]$builder.AppendLine("|---|---|---|---|---|---|")

  foreach ($item in $orderedFindings) {
    $fileLine = "{0}:{1}" -f (Escape-Markdown ([string]$item.File)), $item.Line
    $matchCell = Escape-Markdown ([string]$item.Match)
    $snippetCell = Escape-Markdown ([string]$item.Snippet)
    [void]$builder.AppendLine(
      ('| {0} | {1} | {2} | `{3}` | `{4}` | {5} |' -f `
        $item.Severity, `
        $item.RuleId, `
        $item.Scope, `
        $fileLine, `
        $matchCell, `
        $snippetCell)
    )
  }
  [void]$builder.AppendLine("")
}

[void]$builder.AppendLine("## Strict Mode Semantics")
[void]$builder.AppendLine("")
[void]$builder.AppendLine('- Default mode: always exits `0` after writing report.')
[void]$builder.AppendLine('- `-Strict`: exits `2` only when one or more `CLIENT_P0` findings exist.')
[void]$builder.AppendLine('- `SERVER`, `DOCS`, and `TOOLING` findings never trigger strict failure.')
[void]$builder.AppendLine("")

[System.IO.File]::WriteAllText($OutPathResolved, $builder.ToString(), (New-Object System.Text.UTF8Encoding($false)))

Write-Progress -Activity "Gemini Exposure Audit" -Completed -Status "Done"
Write-Host ("[gemini-audit] report={0}" -f $OutPathResolved)
Write-Host ("[gemini-audit] client_p0={0} info={1} strict={2}" -f $clientP0Findings.Count, $infoFindings.Count, $Strict.IsPresent)

if ($Strict -and $clientP0Findings.Count -gt 0) {
  exit 2
}

exit 0
