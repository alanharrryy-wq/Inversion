param(
  [string]$In = ".",
  [string]$Out = "nf_scan_out",
  [int]$MaxFileMb = 200,
  [string]$IncludeExt = ".pdf,.docx,.md,.txt,.qml",
  [string]$ExcludeDirs = ".git,node_modules,dist,build,out,.next,.turbo,.venv,venv,__pycache__,coverage,tmp,temp,.idea,.vscode",
  [double]$NearDupThreshold = 0.92,
  [int]$MaxNearDupPairs = 8000,
  [int]$ChunkSize = 1400,
  [int]$ChunkOverlap = 150
)

python -m tools.foundation_scan.scan `
  --in $In `
  --out $Out `
  --max-file-mb $MaxFileMb `
  --include-ext $IncludeExt `
  --exclude-dirs $ExcludeDirs `
  --near-dup-threshold $NearDupThreshold `
  --max-near-dup-pairs $MaxNearDupPairs `
  --chunk-size $ChunkSize `
  --chunk-overlap $ChunkOverlap

